import type {
  EdgeState,
  NodeState,
  Scene,
  SceneAux,
  SceneEdge,
  SceneNode,
  ScenePointer,
  TraceStep,
} from './types';

export function node(
  id: string,
  value: string | number,
  state: NodeState = 'default',
  label?: string,
  badge?: string,
): SceneNode {
  return { id, value: String(value), state, label, badge };
}

/** 带坐标的结点（树 / 图用；at 为归一化 0–1，省略则由布局器自动排布）。 */
export function nodeAt(
  id: string,
  value: string | number,
  x?: number,
  y?: number,
  state: NodeState = 'default',
  label?: string,
  badge?: string,
): SceneNode {
  const n = node(id, value, state, label, badge);
  if (x !== undefined && y !== undefined) n.at = { x, y };
  return n;
}

export function edge(
  from: string,
  to: string,
  label?: string,
  state: EdgeState = 'default',
  directed = false,
): SceneEdge {
  return { from, to, label, state, directed };
}

export function arrayScene(
  nodes: SceneNode[],
  pointers: ScenePointer[] = [],
  capacity?: number,
  note?: string,
): Scene {
  return { kind: 'array', nodes, pointers, capacity, note };
}

/** 折行网格：矩阵、哈希桶、二维表用。cols 为每行格子数。 */
export function gridScene(
  nodes: SceneNode[],
  cols: number,
  pointers: ScenePointer[] = [],
  note?: string,
): Scene {
  return { kind: 'array', nodes, pointers, cols, note };
}

export function listScene(
  nodes: SceneNode[],
  pointers: ScenePointer[] = [],
  note?: string,
  detached: string[] = [],
): Scene {
  return { kind: 'list', nodes, pointers, note, detached };
}

export function stringMatchScene(main: SceneNode[], pattern: SceneNode[], offset: number, i: number, j: number, note: string): Scene {
  const cols = Math.max(main.length, offset) + pattern.length;
  const blanks = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => node(`${prefix}${index}`, ''));
  return {
    ...gridScene([
      ...main, ...blanks('main-gap', cols - main.length),
      ...blanks('pattern-before', offset), ...pattern, ...blanks('pattern-after', cols - offset - pattern.length),
    ], cols, [
      { label: 'i', index: i < main.length ? i : null },
      { label: 'j', index: j >= 0 && j < pattern.length ? cols + offset + j : null },
    ], note),
    layout: 'string-match',
  };
}

export function treeScene(nodes: SceneNode[], edges: SceneEdge[], note?: string): Scene {
  return { kind: 'tree', nodes, edges, note };
}

export function graphScene(
  nodes: SceneNode[],
  edges: SceneEdge[],
  note?: string,
  pointers: ScenePointer[] = [],
): Scene {
  return { kind: 'graph', nodes, edges, pointers, note };
}

export function auxStruct(
  label: string,
  nodes: SceneNode[],
  pointers: ScenePointer[] = [],
  cols?: number,
): SceneAux {
  return { label, nodes, pointers, cols };
}

/** 顺序表：按固定格子渲染，空格子也要占位，方便观察"长度"与"容量的区别"。 */
export function cells(
  values: (number | string | null)[],
  capacity: number,
  states: Record<number, NodeState> = {},
  labels: Record<number, string> = {},
): SceneNode[] {
  return Array.from({ length: capacity }, (_, k) =>
    node(`c${k}`, values[k] == null ? '' : String(values[k]), states[k] ?? 'default', labels[k]),
  );
}

export function makeStep(
  id: number,
  anchor: string,
  phase: string,
  scene: Scene,
  vars: Record<string, string | number>,
  caption: string,
  callStack?: string[],
): TraceStep {
  const step: TraceStep = { id, anchor, phase, scene, vars, caption };
  if (callStack) step.callStack = callStack;
  return step;
}

/** 便捷构造：把 Record<nodeId, NodeState> 叠加到结点数组上，避免每步手写三元。 */
export function paint(nodes: SceneNode[], states: Record<string, NodeState>): SceneNode[] {
  return nodes.map((n) => ({ ...n, state: states[n.id] ?? n.state ?? 'default' }));
}

/** 便捷构造：把 Record<edgeKey, EdgeState> 叠加到边上，edgeKey 形如 "a>b"。 */
export function paintEdges(edges: SceneEdge[], states: Record<string, EdgeState>): SceneEdge[] {
  return edges.map((e) => ({ ...e, state: states[`${e.from}>${e.to}`] ?? e.state ?? 'default' }));
}
