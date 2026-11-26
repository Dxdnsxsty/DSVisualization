import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { edge, graphScene, node, treeScene } from '../engine/scene';
import { DEFAULT_INPUT, validateInput } from '../engine/input';
import { decodeCustomGraph, formatTreeInput, levelTree, parseCustomGraph, parseTreeInput, TREE_INPUT_FORMAT_ERROR, TREE_LEVEL_INPUT } from '../engine/structure-input';
import type { AlgorithmMeta, Scene, SceneEdge } from '../engine/types';
import { TreeGraphSvg } from './Stage';

function StructureDialog({ title, scene, error, children, onApply, onClose }: {
  title: string;
  scene?: Scene;
  error: string | null;
  children: ReactNode;
  onApply: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog className="graph-dialog" ref={dialog} onClose={onClose} aria-labelledby={titleId}>
      <form className="custom-graph" onSubmit={(event) => {
        event.preventDefault();
        if (error) return;
        onApply();
        dialog.current?.close();
      }}>
        <header className="graph-dialog-head"><h2 id={titleId}>{title}</h2></header>
        <div className="graph-dialog-main">
          <div className="graph-editor-fields">{children}</div>
          <section className={scene?.kind === 'tree' ? 'graph-preview tree-preview' : 'graph-preview'} aria-label="实时预览">
            <span>实时预览</span>
            <div className="graph-preview-canvas">
              {scene ? <TreeGraphSvg scene={scene} compact label={title + '预览'} /> :
                <p className="error" role="status">{error}</p>}
            </div>
          </section>
        </div>
        <footer className="graph-editor-actions">
          <button type="button" onClick={() => dialog.current?.close()}>取消</button>
          <button type="submit" className="primary" disabled={!!error}>确定</button>
        </footer>
      </form>
    </dialog>
  );
}

export function CustomGraphDialog({ algo, input, regenerate, onClose }: {
  algo: AlgorithmMeta;
  input: number[];
  regenerate: (input: number[]) => void;
  onClose: () => void;
}) {
  const signed = algo.customGraph === 'weighted-signed';
  const weighted = signed || algo.customGraph === 'weighted';
  const hasSource = algo.customGraph !== 'directed';
  const directed = algo.customGraph !== 'undirected';
  const graph = decodeCustomGraph(input);
  const [vertices, setVertices] = useState(() => graph?.labels.join(', ') ?? 'A, B, C, D');
  const [start, setStart] = useState(() => graph ? graph.labels[graph.source] : 'A');
  const [edges, setEdges] = useState(() => graph
    ? graph.edges.map(([from, to, weight]) =>
      [graph.labels[from], graph.labels[to], ...(weighted ? [weight] : [])].join(' ')).join('\n')
    : signed ? 'A B 4\nB C -2' : weighted ? 'A B 4\nB C 2' : 'A B\nB C');
  let parsed: number[] | undefined;
  let error: string | null;
  try {
    parsed = parseCustomGraph(vertices, hasSource ? start : null, edges, weighted, signed);
    error = validateInput(algo.input ?? DEFAULT_INPUT, parsed);
  } catch (failure) {
    error = failure instanceof Error ? failure.message : '无法读取图结构';
  }
  const preview = !error && parsed ? decodeCustomGraph(parsed) : undefined;
  const scene = preview && graphScene(
    preview.labels.map((label, index) => node(label, label, hasSource && index === preview.source ? 'active' : 'default',
      undefined, hasSource && index === preview.source ? '起点' : undefined)),
    preview.edges.map(([from, to, weight]) =>
      edge(preview.labels[from], preview.labels[to], weighted ? String(weight) : undefined, 'default', directed)),
  );

  return (
    <StructureDialog title="自定义图" scene={scene} error={error} onClose={onClose}
      onApply={() => { if (parsed) regenerate(parsed); }}>
      <div className="graph-field-label">
        <label htmlFor="dsv-vertices">顶点</label>
        <small id="dsv-vertices-hint">1–6 个不同的英文字母</small>
      </div>
      <input id="dsv-vertices" autoFocus aria-describedby="dsv-vertices-hint" value={vertices}
        onChange={(event) => setVertices(event.target.value)} spellCheck={false} />
      {hasSource && <>
        <label htmlFor="dsv-start">起点</label>
        <input id="dsv-start" value={start} onChange={(event) => setStart(event.target.value)} spellCheck={false} />
      </>}
      <label htmlFor="dsv-edges">{weighted ? '有向带权边' : directed ? '有向边' : '无向边'}</label>
      <textarea id="dsv-edges" rows={4} aria-describedby="dsv-edge-hint" value={edges}
        onChange={(event) => setEdges(event.target.value)} spellCheck={false} />
      <small id="dsv-edge-hint">每行一条，如 <code>{signed ? 'A B -2' : weighted ? 'A B 4' : 'A B'}</code>{signed ? '，权重 -999 至 999' : weighted ? '，权重 0–999' : directed ? ' 表示 A → B' : ''}。允许留空。</small>
    </StructureDialog>
  );
}

export function CustomTreeDialog({ input, regenerate, onClose }: {
  input: number[];
  regenerate: (input: number[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => formatTreeInput(input));
  const parsed = parseTreeInput(draft);
  const error = parsed.some(Number.isNaN) ? TREE_INPUT_FORMAT_ERROR : validateInput(TREE_LEVEL_INPUT, parsed);
  let scene: Scene | undefined;
  if (!error) {
    const { vals, left, right } = levelTree(parsed);
    const ids = vals.map((_, index) => `n${index}`);
    const edges: SceneEdge[] = [];
    for (const [index, id] of ids.entries()) {
      if (left[index] >= 0) edges.push({ ...edge(id, ids[left[index]]), side: 'left' });
      if (right[index] >= 0) edges.push({ ...edge(id, ids[right[index]]), side: 'right' });
    }
    scene = treeScene(vals.map((value, index) => node(ids[index], value)), edges);
  }

  return (
    <StructureDialog title="自定义二叉树" scene={scene} error={error} onClose={onClose}
      onApply={() => regenerate(parsed)}>
      <label htmlFor="dsv-tree-level">层序输入</label>
      <textarea id="dsv-tree-level" rows={4} autoFocus spellCheck={false} value={draft}
        aria-describedby="dsv-tree-hint" onChange={(event) => setDraft(event.target.value)} />
      <small id="dsv-tree-hint">最多 15 个结点。输入整数或单个英文字母，用 <code>null</code> 表示空孩子。例如 <code>A, null, B</code> 中，B 是 A 的右孩子。</small>
    </StructureDialog>
  );
}
