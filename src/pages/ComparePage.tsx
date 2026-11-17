import { useMemo, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { Stage } from '../components/Stage';
import type { AlgorithmMeta } from '../engine/types';
import { navigate } from '../engine/router';

const SORTS = algorithms.filter((a) => a.category === 'ch10');

function safeInput(a: AlgorithmMeta, source: number[]): number[] {
  const spec = a.input;
  const min = spec?.min ?? -999;
  const max = spec?.max ?? 999;
  const minLen = spec?.minLen ?? 2;
  const maxLen = spec?.maxLen ?? 10;
  const vals = source.map((n) => Math.max(min, Math.min(max, n))).slice(0, maxLen);
  while (vals.length < minLen) vals.push(Math.max(min, 0));
  return vals;
}

function Pane({ algo, input }: { algo: AlgorithmMeta; input: number[] }) {
  const trace = useMemo(() => algo.generate(safeInput(algo, input)), [algo, input]);
  const [step, setStep] = useState(0);
  const cur = trace[Math.min(step, trace.length - 1)];
  const final = trace[trace.length - 1];
  return (
    <section className="panel compare-pane">
      <div className="panel-head"><span>{algo.title}</span><button className="mini" onClick={() => navigate(`algo/${algo.slug}`)}>单独学习</button></div>
      <Stage scene={cur.scene} />
      <div className="compare-caption">步骤 {step + 1} / {trace.length} · {cur.caption}</div>
      <input className="progress" type="range" min={0} max={trace.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} aria-label={`${algo.title}播放进度`} />
      <div className="compare-metrics">
        <span>步骤数 <b>{trace.length}</b></span>
        <span>终态 <code>{final.scene.nodes.map((n) => n.value).filter(Boolean).join(', ')}</code></span>
      </div>
    </section>
  );
}

export function ComparePage() {
  const [left, setLeft] = useState('sort/insert-sort');
  const [right, setRight] = useState('sort/quick-sort');
  const [raw, setRaw] = useState('49, 38, 65, 97, 76, 13, 27');
  const [input, setInput] = useState([49, 38, 65, 97, 76, 13, 27]);
  const parse = () => {
    const nums = raw.split(/[\s,，、]+/).filter(Boolean).map(Number);
    if (nums.length >= 2 && nums.every(Number.isInteger)) setInput(nums);
  };
  const a = getAlgorithm(left) ?? SORTS[0];
  const b = getAlgorithm(right) ?? SORTS[1];
  return (
    <main className="page compare-page">
      <div className="page-intro"><h1>算法对比实验室</h1><p>同一组输入，并排观察不同算法的步骤数量、状态变化与最终结果。</p></div>
      <section className="panel compare-controls">
        <label>共同输入 <input value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={parse} /></label>
        <button className="primary" onClick={parse}>应用输入</button>
        <label>左侧 <select value={left} onChange={(e) => setLeft(e.target.value)}>{SORTS.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></label>
        <label>右侧 <select value={right} onChange={(e) => setRight(e.target.value)}>{SORTS.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></label>
      </section>
      <div className="compare-grid"><Pane algo={a} input={input} /><Pane algo={b} input={input} /></div>
    </main>
  );
}
