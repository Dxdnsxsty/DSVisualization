import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const dir = mkdtempSync(join(tmpdir(), 'dsv-examples-'));
const run = (command, args) => execFileSync(command, args, { cwd: dir, encoding: 'utf8', timeout: 30000 }).trim();
try {
  const bundle = await build({ entryPoints: ['src/algorithms/registry.ts'], bundle: true, format: 'esm', write: false });
  const registry = join(dir, 'registry.mjs');
  writeFileSync(registry, bundle.outputFiles[0].text);
  const { getAlgorithm } = await import(pathToFileURL(registry).href);
  const cases = [
    ['tree/avl-insert', [60, 20, 10]],
    ['tree/avl-insert', [10, 20, 30]],
    ['tree/avl-insert', [30, 10, 20]],
    ['tree/avl-insert', [10, 30, 20]],
    ['tree/avl-insert', [60, 20, 10, 40, 50, 30, 70]],
    ['graph/floyd', [4]], ['graph/floyd', [5]],
    ['tree/huffman', [5, 29, 7, 8, 14, 23, 3, 11]],
    ['tree/huffman', Array(8).fill(1)], ['tree/huffman', [3, 5]],
  ];
  for (const [index, [slug, input]] of cases.entries()) {
    const algo = getAlgorithm(slug);
    const final = algo.generate(input).at(-1).scene;
    let expected;
    if (final.distanceMatrix) {
      expected = final.distanceMatrix.values.map((row) => row.join(' ').replaceAll('∞', 'INF')).join('\n');
    } else if (final.huffman) {
      const { rows, wpl } = final.huffman;
      for (const row of rows) {
        const bits = row.path.slice(1).map((id, i) => {
          const edge = final.edges.find((e) => e.from === row.path[i] && e.to === id);
          assert.match(edge?.label ?? '', /^[01]$/);
          return edge.label;
        }).join('');
        assert.equal(bits, row.bits);
      }
      assert.equal(wpl, rows.reduce((sum, row) => sum + row.weight * row.bits.length, 0));
      expected = [...rows.map((row) => `${row.symbol} ${row.weight} ${row.bits}`), `WPL ${wpl}`].sort();
    } else {
      const children = new Set(final.edges.map((edge) => edge.to));
      const preorder = (id) => {
        if (!id) return ['-'];
        const edges = final.edges.filter((edge) => edge.from === id);
        return [final.nodes.find((node) => node.id === id).value,
          ...preorder(edges.find((edge) => edge.side === 'left')?.to),
          ...preorder(edges.find((edge) => edge.side === 'right')?.to)];
      };
      expected = preorder(final.nodes.find((node) => !children.has(node.id)).id).join(' ');
    }
    for (const lang of ['cpp', 'python']) {
      const source = join(dir, `example-${index}.${lang === 'cpp' ? 'cpp' : 'py'}`);
      writeFileSync(source, algo.runnable(lang, input, algo.code[lang].map((line) => line.text).join('\n')));
      let output;
      if (lang === 'cpp') {
        const executable = join(dir, `example-${index}.exe`);
        run(process.env.CXX || 'g++', ['-std=c++17', source, '-o', executable]);
        output = run(executable, []);
      } else {
        output = run(process.env.PYTHON || 'python', [source]);
      }
      output = output.replaceAll('\r\n', '\n');
      assert.deepEqual(final.huffman ? output.split('\n').sort() : output, expected, `${slug} ${lang} [${input}]`);
    }
  }
  console.log(`可运行示例通过：${cases.length * 2} 次 C++／Python 执行结果与动画终态一致。`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
