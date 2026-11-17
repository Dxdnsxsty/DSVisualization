import type { AlgorithmMeta, NodeState, SceneNode, ScenePointer, TraceStep } from '../../engine/types';
import { gridScene, makeStep, node } from '../../engine/scene';

const ROWS = 4;
const COLS = 4;
/** 固定示例：4×4 矩阵中只有 6 个非零元素，其余都是零。 */
const MAT = [
  [0, 0, 3, 5],
  [0, 7, 0, 0],
  [2, 0, 0, 0],
  [0, 0, 4, 9],
];

export const sparseTriple: AlgorithmMeta = {
  slug: 'array/sparse-triple',
  title: '稀疏矩阵 · 三元组表示',
  chapter: '第 6 章 数组和广义表',
  category: 'ch6',
  summary: '只存非零元素的(行,列,值)三元组。',
  complexity: { time: 'O(m×n)', space: 'O(t)', extra: 't 为非零元素个数，需扫描全矩阵' },
  difficulty: '入门',
  inputHint: '输入三元组表最多记录的行数 t（3–9），按示例 4×4 稀疏矩阵演示逐行扫描建表。',
  defaultInput: [6],
  input: { min: 3, max: 9, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define ROWS 4' },
      { text: '#define COLS 4' },
      { text: '#define MAXT 10' },
      { text: 'void SparseToTriple(int A[ROWS][COLS], int T[MAXT][3]) {' },
      { text: '  int k = 0;', anchor: 'init' },
      { text: '  for (int i = 0; i < ROWS; i++)' },
      { text: '    for (int j = 0; j < COLS; j++) {' },
      { text: '      int value = A[i][j];', anchor: 'scan' },
      { text: '      if (value == 0) continue;', anchor: 'zero' },
      { text: '      T[k][0] = i; T[k][1] = j; T[k][2] = value;', anchor: 'write' },
      { text: '      k++;' },
      { text: '    }' },
      { text: '  // T 的前 k 行就是全部三元组', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'ROWS, COLS = 4, 4' },
      { text: 'def sparse_to_triple(a):' },
      { text: '    k = 0', anchor: 'init' },
      { text: '    t = []' },
      { text: '    for i in range(ROWS):' },
      { text: '        for j in range(COLS):' },
      { text: '            value = a[i][j]', anchor: 'scan' },
      { text: '            if value == 0: continue', anchor: 'zero' },
      { text: '            t.append((i, j, value))', anchor: 'write' },
      { text: '            k += 1' },
      { text: '    # t 的前 k 行就是全部三元组', anchor: 'done' },
      { text: '    return t' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '稀疏矩阵中非零元素很少，若按二维数组整块存储，绝大多数单元都在浪费空间。三元组表示只记录每个非零元素的 (行号, 列号, 值)，按行优先顺序排列成一张表，表的行数等于非零元素个数 t。存储量从 m×n 降到 3t。',
      points: [
        '每个三元组占 3 个单元，总空间与 t 成正比，与 m×n 无关',
        '行优先排序保证同一行内列号递增，便于按行遍历',
        '严格说还需记录矩阵的行数、列数和非零个数，否则无法还原形状',
      ],
    },
    {
      heading: '建立过程',
      body: '用双重循环按行优先扫描整个矩阵：遇到零元素直接跳过，遇到非零元素就把 (i, j, A[i][j]) 追加到三元组表末尾，计数器加一。扫描完成后表中的顺序天然满足行优先，不需要额外排序。',
      points: ['必须先判零再写入，否则三元组表会被零元素占满', '计数器 k 既是写入位置，也是最终非零元素个数'],
    },
    {
      heading: '复杂度与易错点',
      body: '建立三元组表需要扫描全部 m×n 个单元，时间 O(m×n)，空间 O(t)。转置是三元组最常见的操作：直接按列扫描 O(n×t)，而「快速转置」先统计每列非零个数、再求起始位置，可以做到 O(n+t)。',
    },
  ],
  quiz: [
    { q: '三元组表的一行存的是什么？', options: ['(行, 列, 值)', '(值, 行, 列)', '(行, 列)', '(下标, 值)'], answer: 0, explain: '每个非零元素用行号、列号和数据值三个分量表示。' },
    { q: '4×4 矩阵有 6 个非零元素，三元组表需要多少行？', options: ['16', '6', '4', '10'], answer: 1, explain: '只存非零元素，行数等于非零元素个数 t = 6。' },
    { q: '建立三元组表的时间复杂度是？', options: ['O(t)', 'O(m×n)', 'O(m+n)', 'O(t²)'], answer: 1, explain: '必须扫描整个矩阵才能找出所有非零元素。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const limit = Math.min(Math.max(Math.trunc(input[0] || 6), 3), 9);
    const triples: string[] = [];
    let cnt = 0;
    let pos: number | null = null;
    let t = 0;

    const push = (anchor: string, phase: string, caption: string, states: Record<string, NodeState> = {}) => {
      const nodes: SceneNode[] = [];
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          nodes.push(node(`m${i}_${j}`, MAT[i][j], states[`m${i}_${j}`] ?? 'default'));
        }
      }
      const auxNodes: SceneNode[] = triples.length
        ? triples.map((v, x) => node(`t${x}`, v, x === triples.length - 1 ? 'insert' : 'sorted'))
        : [node('t_empty', '待写入', 'default')];
      const pointers: ScenePointer[] = pos === null ? [] : [{ label: '扫描', index: pos }];
      steps.push(
        makeStep(
          t++,
          anchor,
          phase,
          {
            ...gridScene(nodes, COLS, pointers, `稀疏矩阵 A（${ROWS}×${COLS}）· 已找到 ${cnt} 个非零元素`),
            aux: { label: '三元组表（每格一个 (行,列,值)）', nodes: auxNodes, cols: Math.max(triples.length, 1) },
          },
          {
            当前行: pos === null ? '—' : Math.floor(pos / COLS),
            当前列: pos === null ? '—' : pos % COLS,
            非零个数: cnt,
            三元组行数: triples.length,
          },
          caption,
        ),
      );
    };

    push('init', '准备', `三元组表只存非零元素：非零元素最多 ${limit} 个，零元素一个都不存。`);
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        const v = MAT[i][j];
        pos = i * COLS + j;
        if (v === 0) {
          push('zero', '扫描矩阵', `扫描到 A[${i}][${j}] = 0，是零元素，直接跳过。`, { [`m${i}_${j}`]: 'visited' });
        } else if (cnt >= limit) {
          push('scan', '扫描矩阵', `A[${i}][${j}] = ${v} 非零，但三元组表已到上限 ${limit} 行，本例不再追加。`, {
            [`m${i}_${j}`]: 'compare',
          });
        } else {
          push('scan', '扫描矩阵', `扫描到 A[${i}][${j}] = ${v}，是非零元素，准备写入三元组表。`, {
            [`m${i}_${j}`]: 'compare',
          });
          cnt += 1;
          triples.push(`${i},${j},${v}`);
          push('write', '写入三元组', `追加第 ${cnt} 个三元组 (${i}, ${j}, ${v})，行优先扫描保证顺序天然有序。`, {
            [`m${i}_${j}`]: 'insert',
          });
        }
      }
    }
    pos = null;
    push('done', '完成', `扫描结束：矩阵共 ${ROWS * COLS} 个单元，只有 ${cnt} 个非零元素，三元组表占 ${cnt} 行。`);
    return steps;
  },
};
