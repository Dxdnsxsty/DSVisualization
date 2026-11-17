import type { AlgorithmMeta, TraceStep } from './types';
import { DEFAULT_INPUT, randomInput, validateInput } from './input';

/** 内容校验：新增算法后跑 `npm run validate`，避免行锚点错位、场景 id 重复等隐性 bug。 */
export function validateAlgorithm(a: AlgorithmMeta): string[] {
  const errors: string[] = [];
  const tag = a.slug ?? '<未命名>';
  const required: (keyof AlgorithmMeta)[] = [
    'slug', 'title', 'chapter', 'category', 'summary', 'inputHint', 'code', 'doc', 'quiz', 'generate',
  ];
  for (const k of required) {
    if (!a[k]) errors.push(`${tag}: 缺少必填字段 ${String(k)}`);
  }

  // 输入规则自洽性：默认输入必须合法；声明了 random 也要保证生得出合法数据
  const spec = a.input ?? DEFAULT_INPUT;
  const specErr = validateInput(spec, a.defaultInput);
  if (specErr) errors.push(`${tag}: defaultInput 不满足自身输入规则（${specErr}）`);
  if (a.input) {
    // 「随机」按钮必须是可靠的：无论靠通用采样还是专用生成器，采出来的都必须合法
    for (let i = 0; i < 8; i++) {
      const r = randomInput(spec);
      const e = validateInput(spec, r);
      if (e) { errors.push(`${tag}: 「随机」生成了非法输入 ${r.join(',')}（${e}）`); break; }
    }
  }

  // 输入是否真的被使用：换一组合法输入，轨迹不该与默认轨迹完全相同
  if (a.input) {
    let sample: number[] | null = null;
    for (let i = 0; i < 8; i++) {
      const r = randomInput(spec);
      if (!validateInput(spec, r) && r.join(',') !== a.defaultInput.join(',')) { sample = r; break; }
    }
    if (sample) {
      const t1 = JSON.stringify(a.generate(a.defaultInput));
      const t2 = JSON.stringify(a.generate(sample));
      if (t1 === t2) {
        errors.push(`${tag}: 换成合法输入 ${sample.join(',')} 后轨迹与默认完全相同（输入被忽略）`);
      }
    }
  }

  const langs = Object.keys(a.code ?? {});
  if (langs.length === 0) errors.push(`${tag}: 至少提供一种语言的代码`);

  const perLang: Record<string, Set<string>> = {};
  for (const lang of langs) {
    perLang[lang] = new Set(a.code[lang].filter((l) => l.anchor).map((l) => l.anchor as string));
  }
  const allAnchors = new Set<string>(langs.flatMap((l) => [...perLang[l]]));
  for (const lang of langs) {
    for (const anchor of allAnchors) {
      if (!perLang[lang].has(anchor)) errors.push(`${tag}: ${lang} 代码缺少行锚点 ${anchor}（切换语言会错位）`);
    }
  }

  let trace: TraceStep[];
  try {
    trace = a.generate(a.defaultInput);
  } catch (e) {
    errors.push(`${tag}: generate() 抛错 ${String(e)}`);
    return errors;
  }
  if (!Array.isArray(trace) || trace.length === 0) {
    errors.push(`${tag}: generate() 必须返回非空步骤序列`);
    return errors;
  }

  trace.forEach((s, i) => {
    if (s.id !== i) errors.push(`${tag}: 第 ${i} 步的 id 应为 ${i}，实际 ${s.id}`);
    if (!s.caption) errors.push(`${tag}: 第 ${i} 步缺少 caption`);
    if (!s.phase) errors.push(`${tag}: 第 ${i} 步缺少 phase`);
    if (!allAnchors.has(s.anchor)) errors.push(`${tag}: 第 ${i} 步引用了不存在的锚点 ${s.anchor}`);
    if (!s.vars || typeof s.vars !== 'object') errors.push(`${tag}: 第 ${i} 步缺少 vars`);
    if (!s.scene) {
      errors.push(`${tag}: 第 ${i} 步缺少 scene`);
      return;
    }
    const ids = s.scene.nodes.map((n) => n.id);
    if (new Set(ids).size !== ids.length) errors.push(`${tag}: 第 ${i} 步存在重复图元 id`);
    for (const p of s.scene.pointers ?? []) {
      if (p.index !== null && (p.index < 0 || p.index >= s.scene.nodes.length)) {
        errors.push(`${tag}: 第 ${i} 步指针 ${p.label} 下标 ${p.index} 越界（共 ${s.scene.nodes.length} 个图元）`);
      }
    }
  });
  if (trace.length > 5000) errors.push(`${tag}: 默认输入产生 ${trace.length} 步，超过 5000 步上限`);
  if (!a.doc?.length) errors.push(`${tag}: 缺少图文讲解`);
  return errors;
}

export function validateAll(list: AlgorithmMeta[]): string[] {
  return list.flatMap(validateAlgorithm);
}
