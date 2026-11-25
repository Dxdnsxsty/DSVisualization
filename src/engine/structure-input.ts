import { GRAPH_SIZE_INPUT, validateInput } from './input';
import type { CustomGraphKind, InputSpec } from './types';

// 用整数编码复用播放器、练习和回放链接。旧的纯数字树、预设图输入保持原格式。
const EMPTY = 1000;
const CUSTOM_GRAPH = -1;
const letterIndex = (text: string) => /^[A-Z]$/.test(text) ? text.charCodeAt(0) - 65 : -1;
const letter = (index: number) => String.fromCharCode(65 + index);
const tokens = (text: string) => text.trim().split(/[\s,，、]+/).filter(Boolean);
export const TREE_INPUT_FORMAT_ERROR = '请输入 -999 至 999 的整数、单个英文字母或 null';

function treeValue(value: number): number | string {
  return value > EMPTY ? letter(value - EMPTY - 1) : value;
}

export function formatTreeInput(input: number[]): string {
  return input.map((value) => value === EMPTY ? 'null' : treeValue(value)).join(', ');
}

export function parseTreeInput(text: string): number[] {
  return tokens(text).map((token) => {
    if (token.toLowerCase() === 'null') return EMPTY;
    const index = letterIndex(token.toUpperCase());
    if (index >= 0) return EMPTY + 1 + index;
    return /^-?\d+$/.test(token) && Math.abs(Number(token)) <= 999 ? Number(token) : NaN;
  });
}

/** 每个真实结点依次读取两个孩子；空位不再读取孩子。 */
export function levelTree(input: number[]) {
  const vals = [treeValue(input[0])];
  const left: number[] = [];
  const right: number[] = [];
  const depths = [1];
  let cursor = 1;
  for (let parent = 0; parent < vals.length; parent++) {
    for (const side of [left, right]) {
      const value = input[cursor];
      if (cursor < input.length) cursor++;
      if (value === undefined || value === EMPTY) {
        side[parent] = -1;
      } else {
        side[parent] = vals.length;
        vals.push(treeValue(value));
        depths.push(depths[parent] + 1);
      }
    }
  }
  return { vals, left, right, height: Math.max(...depths), consumed: cursor };
}

export const TREE_LEVEL_INPUT: InputSpec = {
  format: 'tree-level', min: -999, max: EMPTY + 26, minLen: 1, maxLen: 31,
  check: (input) => {
    if (input[0] === EMPTY) return '根结点不能为空';
    const tree = levelTree(input);
    if (tree.consumed !== input.length) return '没有可接收剩余输入的父结点，请检查多余的值或空位';
    if (tree.vals.length > 15) return '最多支持 15 个结点';
    return null;
  },
  random: () => Array.from({ length: 2 + Math.floor(Math.random() * 14) }, () => Math.floor(Math.random() * 1999) - 999),
};

export function parseCustomGraph(vertices: string, start: string | null, edges: string, weighted: boolean): number[] {
  const labels = tokens(vertices.toUpperCase()).map(letterIndex);
  // 拓扑排序不选起点，保留此字段以沿用现有回放格式。
  const source = start === null ? 0 : labels.indexOf(letterIndex(start.trim().toUpperCase()));
  const encoded = [CUSTOM_GRAPH, labels.length, source, ...labels];
  for (const row of edges.trim().split(/[\r\n;；]+/).filter((line) => line.trim())) {
    const fields = tokens(row.toUpperCase());
    if (fields.length !== (weighted ? 3 : 2)) throw new Error(weighted ? '每行填写起点、终点和权重，如 A B 4' : '每行填写边的两个端点，如 A B');
    const endpoints = fields.slice(0, 2).map((field) => labels.indexOf(letterIndex(field)));
    const weight = weighted ? Number(fields[2]) : 1;
    if (weighted && (!/^\d+$/.test(fields[2]) || weight > 999)) {
      throw new Error('Dijkstra 的边权须为 0–999 的整数');
    }
    encoded.push(...endpoints, weight);
  }
  return encoded;
}

export function decodeCustomGraph(input: number[]) {
  if (input[0] !== CUSTOM_GRAPH) return;
  const [, n, source] = input;
  const labels = input.slice(3, 3 + n).map(letter);
  const edges: [number, number, number][] = [];
  for (let i = 3 + n; i < input.length; i += 3) edges.push([input[i], input[i + 1], input[i + 2]]);
  return { labels, source, edges };
}

export function customGraphInput(kind: CustomGraphKind): InputSpec {
  return {
    ...GRAPH_SIZE_INPUT, min: -1, max: 999, maxLen: 99,
    check: (input) => {
      if (input[0] !== CUSTOM_GRAPH) return validateInput(GRAPH_SIZE_INPUT, input);
      const [, n, source] = input;
      if (n < 1 || n > 6 || input.length < 3 + n) return '请输入 1–6 个顶点';
      const labels = input.slice(3, 3 + n);
      if (labels.some((label) => label < 0 || label > 25) || new Set(labels).size !== n) return '顶点须为互不重复的单个英文字母';
      if (source < 0 || source >= n) return '起点须在顶点列表中';
      if ((input.length - 3 - n) % 3 !== 0) return '边数据不完整';
      const seen = new Set<string>();
      for (const [from, to, weight] of decodeCustomGraph(input)!.edges) {
        if (from < 0 || from >= n || to < 0 || to >= n) return '边的端点须在顶点列表中';
        if (from === to) return '暂不支持自环';
        if (weight < 0) return 'Dijkstra 的边权须为 0–999 的整数';
        if (kind !== 'weighted' && weight !== 1) return '当前算法的边不需要权重';
        const key = kind === 'undirected' ? `${Math.min(from, to)}-${Math.max(from, to)}` : `${from}>${to}`;
        if (seen.has(key)) return '边不能重复';
        seen.add(key);
      }
      return null;
    },
  };
}
