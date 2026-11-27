import { useTranslate } from '../i18n';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { Stage } from '../components/Stage';
import { CustomGraphDialog } from '../components/StructureDialogs';
import type { AlgorithmMeta, TraceStep } from '../engine/types';
import { algorithmReplayPath, comparisonReplayPath, navigate, type ComparisonReplay } from '../engine/router';
import { DEFAULT_INPUT, parseInputText, validateInput } from '../engine/input';
import { comparisonFinished, comparisonReducer, createComparisonPlayback } from '../engine/compare-player';
import { decodeCustomGraph, parseCustomGraph } from '../engine/structure-input';

const SORTS = algorithms.filter((a) => a.category === 'ch10');
const BFS = getAlgorithm('graph/bfs')!;
const DFS = getAlgorithm('graph/dfs')!;
const DEFAULT_GRAPH = parseCustomGraph('A B C D E', 'A', 'A B\nA C\nB D\nC E', false);

function comparisonError(input: number[], pair: AlgorithmMeta[]): string | null {
  for (const algo of pair) {
    const error = validateInput(algo.input ?? DEFAULT_INPUT, input);
    if (error) return `${algo.title}：${error}`;
  }
  return null;
}

function Pane({ algo, trace, step, onLearn, onSeek }: {
  algo: AlgorithmMeta; trace: TraceStep[]; step: number; onLearn: () => void; onSeek: (step: number) => void;
}) {
  const t = useTranslate();
  const cur = trace[step];
  const final = trace[trace.length - 1];
  const traversal = cur.vars.遍历序列;
  return (
    <section className={algo.customGraph ? 'panel compare-pane compare-graph-pane' : 'panel compare-pane'}>
      <div className="panel-head"><span>{t(algo.title)}</span><button className="mini" onClick={onLearn}>{t("单独学习")}</button></div>
      <Stage scene={cur.scene} />
      <div className="compare-caption">{t("步骤 ")}{step + 1} / {trace.length} · {t(cur.caption)}</div>
      <input className="progress" type="range" min={0} max={trace.length - 1} value={step} onChange={(e) => onSeek(Number(e.target.value))} aria-label={t(`${algo.title}播放进度`)} />
      <div className="compare-metrics">
        {cur.metrics ? <>
          <span>{t("累计比较 ")}<b>{cur.metrics.comparisons}</b></span>
          <span>{t("累计交换 ")}<b>{cur.metrics.swaps}</b></span>
          <span>{t("累计写入 ")}<b>{cur.metrics.writes}</b></span>
          <span>{t("其中原数组 ")}<b>{cur.metrics.writes - (cur.metrics.auxiliaryWrites ?? 0)}</b>{t(" · 辅助数组/桶 ")}<b>{cur.metrics.auxiliaryWrites ?? 0}</b></span>
        </> : null}
        <span>{t("步骤数 ")}<b>{trace.length}</b></span>
        {algo.customGraph
          ? <span>{t("当前访问顺序 ")}<code>{traversal && traversal !== '空' ? [...String(traversal)].join(' → ') : t('空')}</code></span>
          : <span>{t("终态 ")}<code>{t(final.scene.nodes.map((n) => n.value).filter(Boolean).join(', '))}</code></span>}
      </div>
    </section>
  );
}

function Comparison({ left, right, input, initialSteps }: {
  left: AlgorithmMeta; right: AlgorithmMeta; input: number[]; initialSteps?: [number, number];
}) {
  const t = useTranslate();
  const traces = useMemo(() => [left.generate([...input]), right.generate([...input])] as const, [left, right, input]);
  const [state, dispatch] = useReducer(comparisonReducer, [traces[0].length, traces[1].length] as [number, number],
    (lengths) => createComparisonPlayback(lengths, initialSteps));
  const finished = comparisonFinished(state);
  const learn = (side: 0 | 1) => {
    const comparison = { left: left.slug, right: right.slug, input, steps: state.steps };
    window.history.replaceState(window.history.state, '', '#/' + comparisonReplayPath(comparison));
    navigate(algorithmReplayPath(side === 0 ? left.slug : right.slug, { input, step: state.steps[side] }, comparison));
  };

  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 760 / state.speed);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.steps, state.speed]);

  return <>
    <section className="panel compare-controls" aria-label={t("同步播放控制")}>
      <button onClick={() => dispatch({ type: 'reset' })}>{t("重置")}</button>
      <button disabled={state.steps.every((step) => step === 0)} onClick={() => dispatch({ type: 'prev' })}>{t("上一步")}</button>
      <button className="primary" aria-pressed={state.playing} onClick={() => dispatch({ type: 'toggle' })}>{t(state.playing ? '暂停' : finished ? '重新播放' : '同步播放')}</button>
      <button disabled={finished} onClick={() => dispatch({ type: 'next' })}>{t("下一步")}</button>
      <label>{t("播放速度 ")}<select value={state.speed} onChange={(e) => dispatch({ type: 'speed', speed: Number(e.target.value) })}>
        {[0.5, 1, 2, 4].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
      </select></label>
      <span className="muted" role="status">{t(state.playing ? '播放中' : finished ? '两侧均已结束' : '已暂停')}</span>
    </section>
    <p className="muted">{t("每次两侧各推进一个演示步骤，先结束的一侧停在终态。拖动任一侧进度会暂停播放；同步步数不代表实际运行速度。")}</p>
    <div className="compare-grid">
      <Pane algo={left} trace={traces[0]} step={state.steps[0]} onLearn={() => learn(0)} onSeek={(step) => dispatch({ type: 'seek', side: 0, step })} />
      <Pane algo={right} trace={traces[1]} step={state.steps[1]} onLearn={() => learn(1)} onSeek={(step) => dispatch({ type: 'seek', side: 1, step })} />
    </div>
  </>;
}

function SortComparison({ comparison }: { comparison?: ComparisonReplay }) {
  const t = useTranslate();
  const savedLeft = SORTS.find((algo) => algo.slug === comparison?.left);
  const savedRight = SORTS.find((algo) => algo.slug === comparison?.right);
  const saved = comparison && savedLeft && savedRight && !comparisonError(comparison.input, [savedLeft, savedRight]) ? comparison : undefined;
  const initialInput = saved?.input ?? [49, 38, 65, 97, 76, 13, 27];
  const [left, setLeft] = useState(saved?.left ?? 'sort/insert-sort');
  const [right, setRight] = useState(saved?.right ?? 'sort/quick-sort');
  const [raw, setRaw] = useState(initialInput.join(', '));
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const a = getAlgorithm(left) ?? SORTS[0];
  const b = getAlgorithm(right) ?? SORTS[1];
  const parse = () => {
    const { nums, error: parseError } = parseInputText(raw);
    const nextError = parseError ?? comparisonError(nums, [a, b]);
    setError(nextError);
    if (nextError) return;
    setInput(nums);
    setRevision((value) => value + 1);
  };
  const selectAlgorithm = (side: 'left' | 'right', slug: string) => {
    const next = getAlgorithm(slug);
    if (!next) return;
    const nextError = comparisonError(input, side === 'left' ? [next, b] : [a, next]);
    setError(nextError ? `无法切换，${nextError}。请先修改并应用共同输入。` : null);
    if (nextError) return;
    if (side === 'left') setLeft(slug);
    else setRight(slug);
    setRevision((value) => value + 1);
  };
  return (
    <>
      <form className="panel compare-controls" onSubmit={(e) => { e.preventDefault(); parse(); }}>
        <label>{t("共同输入 ")}<input value={raw} onChange={(e) => setRaw(e.target.value)} aria-describedby="compare-input-status" /></label>
        <button className="primary" type="submit">{t("应用输入")}</button>
        <label>{t("左侧 ")}<select value={left} onChange={(e) => selectAlgorithm('left', e.target.value)}>{SORTS.map((x) => <option key={x.slug} value={x.slug}>{t(x.title)}</option>)}</select></label>
        <label>{t("右侧 ")}<select value={right} onChange={(e) => selectAlgorithm('right', e.target.value)}>{SORTS.map((x) => <option key={x.slug} value={x.slug}>{t(x.title)}</option>)}</select></label>
      </form>
      <p id="compare-input-status" className={error ? 'error' : 'muted'} role={error ? 'alert' : undefined}>
        {t(error ? `${error} 当前仍使用已应用的数据：${input.join(', ')}。` : `当前共同输入：${input.join(', ')}。修改后点击「应用输入」或按回车。`)}
      </p>
      <p className="muted">{t("计数规则：只统计关键字比较和数据元素写入；累计写入包含原数组及辅助数组/桶，一次交换计 2 次写入，相同值写回也计数。临时变量、边界判断、数组初始化、清空和演示快照不计。基数排序按位分桶，不比较关键字大小，因此比较次数为 0；移位与填坑不计交换。操作次数和演示步骤数均不代表运行耗时。")}</p>
      {/* 成功应用数据或切换算法时，卸载旧播放器以取消计时并重置两侧。 */}
      <Comparison key={revision} left={a} right={b} input={input} initialSteps={revision === 0 ? saved?.steps : undefined} />
    </>
  );
}

function GraphComparison({ comparison }: { comparison?: ComparisonReplay }) {
  const t = useTranslate();
  const saved = comparison?.left === BFS.slug && comparison.right === DFS.slug &&
    comparison.input[0] === -1 && !comparisonError(comparison.input, [BFS, DFS]) ? comparison : undefined;
  const [input, setInput] = useState(saved?.input ?? DEFAULT_GRAPH);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const graph = decodeCustomGraph(input)!;
  const edges = graph.edges.map(([from, to]) => `${graph.labels[from]}–${graph.labels[to]}`).join(', ');
  return <>
    <div className="panel compare-controls">
      <span>{t(`顶点 ${graph.labels.join(', ')}，起点 ${graph.labels[graph.source]}，边 ${edges || '无'}`)}</span>
      <button ref={trigger} type="button" aria-haspopup="dialog" onClick={() => setEditing(true)}>{t('自定义图')}</button>
    </div>
    {editing && <CustomGraphDialog algo={BFS} input={input}
      regenerate={(next) => { setInput(next); setRevision((value) => value + 1); }}
      onClose={() => { setEditing(false); trigger.current?.focus(); }} />}
    <Comparison key={revision} left={BFS} right={DFS} input={input} initialSteps={revision === 0 ? saved?.steps : undefined} />
  </>;
}

export function ComparePage({ comparison, graph }: { comparison?: ComparisonReplay; graph?: true }) {
  const t = useTranslate();
  return (
    <main className="page compare-page">
      <div className="page-intro"><h1>{t("算法对比实验室")}</h1><p>{t("同一组输入，并排观察不同算法的步骤数量、状态变化与最终结果。")}</p></div>
      <div className="compare-modes" role="group" aria-label={t('对比类型')}>
        <button type="button" aria-pressed={!graph} onClick={() => { if (graph) navigate('compare'); }}>{t('排序对比')}</button>
        <button type="button" aria-pressed={!!graph} onClick={() => { if (!graph) navigate('compare/graph'); }}>BFS / DFS</button>
      </div>
      {graph ? <GraphComparison comparison={comparison} /> : <SortComparison comparison={comparison} />}
    </main>
  );
}
