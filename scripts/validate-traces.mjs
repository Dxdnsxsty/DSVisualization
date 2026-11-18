/**
 * 零后端依赖的内容校验：用 esbuild 把 TS 注册表临时打包成 ESM，再真正执行每个算法的
 * generate()，检查行锚点对齐、场景图元 id 唯一、步骤连续性等。
 * 运行：npm run validate
 */
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkAlgorithm } from './assertions.mjs';
import { checkSortMetrics } from './sort-metrics.mjs';
import { checkComparisonPlayback } from './comparison-playback.mjs';
import { checkStackQueue } from './stack-queue.mjs';
import { checkPlayerRoute } from './player-route.mjs';
import { checkListPointers } from './list-pointers.mjs';
import { checkGraphTraversal } from './graph-traversal.mjs';
import { checkKmpNext } from './kmp-next.mjs';

const result = await build({
  entryPoints: ['src/algorithms/registry.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  write: false,
  logLevel: 'silent',
});

const dir = await mkdtemp(join(tmpdir(), 'dsv-validate-'));
const file = join(dir, 'registry.mjs');

try {
  await writeFile(file, result.outputFiles[0].text);
  const mod = await import(pathToFileURL(file).href);
  const errors = [...mod.validateAll(mod.algorithms)];

  const slugs = new Set();
  for (const a of mod.algorithms) {
    if (slugs.has(a.slug)) errors.push(`重复的算法 slug: ${a.slug}`);
    slugs.add(a.slug);
    const trace = a.generate(a.defaultInput);
    const assertErrors = checkAlgorithm(a, trace);
    errors.push(...assertErrors);
    const flag = assertErrors.length > 0 ? '  ✗' : '';
    console.log(`  ${a.slug.padEnd(28)} ${String(trace.length).padStart(4)} 步  ·  ${Object.keys(a.code).join(' / ')}${flag}`);
  }
  for (const c of mod.categories) {
    for (const s of c.slugs) {
      if (!slugs.has(s)) errors.push(`章节 ${c.id} 引用了不存在的算法 ${s}`);
    }
  }
  errors.push(...checkSortMetrics(mod.algorithms));
  errors.push(...await checkComparisonPlayback());
  errors.push(...checkStackQueue(mod.algorithms), ...await checkPlayerRoute());
  errors.push(...checkListPointers(mod.algorithms), ...checkGraphTraversal(mod.algorithms));
  errors.push(...checkKmpNext(mod.algorithms));

  if (errors.length > 0) {
    console.error('\n校验未通过：');
    for (const e of errors) console.error('  - ' + e);
    process.exitCode = 1;
  } else {
    console.log(`\n校验通过：${mod.algorithms.length} 个算法，${mod.categories.length} 个章节。`);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
