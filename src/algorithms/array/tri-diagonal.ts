import type { AlgorithmMeta, NodeState, SceneNode, ScenePointer, TraceStep } from '../../engine/types';
import { gridScene, makeStep, node } from '../../engine/scene';

/** 三对角矩阵：只有主对角线及其上下两条斜带（|i-j| ≤ 1）非零，共 3n-2 个元素。 */
export const triDiagonal: AlgorithmMeta = {
  slug: 'array/tri-diagonal',
  title: '三对角矩阵 · 压缩存储',
  chapter: '第 6 章 数组和广义表',
  category: 'ch6',
  summary: '三带共 3n-2 个元素，按行优先压成一维数组。',
  complexity: { time: 'O(n)', space: 'O(n)', extra: '存储量由 n² 降到 3n-2' },
  difficulty: '进阶',
  inputHint: '输入矩阵阶数 n（3–6）。以 4 阶为例，非零元素只出现在 |i-j| ≤ 1 的位置，共 3n-2 = 10 个。',
  defaultInput: [4],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define N 4' },
      { text: 'void StoreTri(int A[][N], int B[]) {' },
      { text: '  // 非零元素只在对角线三带上：|i - j| <= 1', anchor: 'init' },
      { text: '  for (int i = 0; i < N; i++) {', anchor: 'loopI' },
      { text: '    for (int j = i - 1; j <= i + 1; j++) {', anchor: 'loopJ' },
      { text: '      if (j < 0 || j >= N) continue;  // 跳出行边界' },
      { text: '      int k = 2 * i + j;', anchor: 'calc' },
      { text: '      B[k] = A[i][j];', anchor: 'write' },
      { text: '    }' },
      { text: '  }' },
      { text: '  // 共 3N-2 个非零元素', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'N = 4' },
      { text: 'def store_tri(a):' },
      { text: '    # 非零元素只在对角线三带上：abs(i - j) <= 1', anchor: 'init' },
      { text: '    b = [0] * (3 * N - 2)' },
      { text: '    for i in range(N):', anchor: 'loopI' },
      { text: '        for j in range(i - 1, i + 2):', anchor: 'loopJ' },
      { text: '            if j < 0 or j >= N:' },
      { text: '                continue' },
      { text: '            k = 2 * i + j', anchor: 'calc' },
      { text: '            b[k] = a[i][j]', anchor: 'write' },
      { text: '    # 共 3N-2 个非零元素', anchor: 'done' },
      { text: '    return b' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '三对角矩阵的非零元素全部挤在主对角线和它上下各一条斜带上，其余位置恒为 0，不必存储。把这三条带按行优先首尾相接，就得到长度为 3n-2 的一维数组，读写下标直接由行号列号算出。',
      points: [
        '每行最多 3 个非零元素，首末两行各 2 个，合计 3n-2',
        '第 i 行存 i-1、i、i+1 三列，越界的列要跳过',
        '压缩后仍能 O(1) 定位，不需要扫描',
      ],
    },
    {
      heading: '下标公式 k = 2i + j 怎么来',
      body: '元素 (i, j) 只在 j = i-1、i、i+1 三处出现，可以写成 j = i + t（t = -1、0、1）。若把 k 写成 2i + j，就等价于 3i + t：第 i 行的三个位置落在 3i-1、3i、3i+1 上，恰好与前面各行的长度衔接。第 0 行没有 j = -1，只占 k = 0、1 两格，因此整体正好从 0 连续排到 3n-3。',
      points: ['公式只对 |i-j| ≤ 1 的元素成立，带外元素本就不存', 'i、j 从 0 开始计数；若从 1 开始，公式要改为 k = 2(i-1) + (j-1)', '对称矩阵的 k = i(i+1)/2 + j 是三角形状，这里是不变宽度的带状'],
    },
    {
      heading: '易错点',
      body: '一是把带外的 0 也照抄进数组，长度会退化成 n²；二是忘记处理首行 j = -1 与末行 j = n 的越界访问；三是行列从 1 开始计数时沿用 0 基公式，导致整体偏移一格。带状矩阵的优点是带宽固定，矩阵乘法、追赶法解方程组都依赖这一点。',
    },
  ],
  quiz: [
    {
      q: 'n 阶三对角矩阵压缩后需要多少个存储单元？',
      options: ['n²', '3n - 2', '2n - 1', 'n(n+1)/2'],
      answer: 1,
      explain: '首末两行各 2 个、其余 n-2 行各 3 个，合计 2 + 2 + 3(n-2) = 3n-2。',
    },
    {
      q: '按行优先存储，元素 A[2][1]（0 基）的一维下标是？',
      options: ['3', '4', '5', '6'],
      answer: 2,
      explain: 'k = 2i + j = 2×2 + 1 = 5，位于第 2 行的起始位置。',
    },
    {
      q: '公式 k = 2i + j 的适用条件是？',
      options: ['任意 i、j', '|i - j| ≤ 1', 'i ≥ j', 'i + j ≤ n'],
      answer: 1,
      explain: '只有落在三条带上的元素才会被存储，带外的 0 不参与映射。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const n = Math.min(Math.max(Math.trunc(Number.isFinite(input[0]) ? input[0] : 4), 3), 6);
    const total = 3 * n - 2;
    const B: (number | null)[] = Array.from({ length: total }, () => null);
    const written = new Set<string>();
    let stored = 0;
    let t = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      ci: number | null,
      cj: number | null,
      kk: number | null,
    ) => {
      const nodes: SceneNode[] = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const key = `a${i}_${j}`;
          const inBand = Math.abs(i - j) <= 1;
          const base: NodeState = inBand ? (written.has(key) ? 'sorted' : 'active') : 'default';
          nodes.push(node(key, inBand ? i * n + j + 1 : 0, states[key] ?? base));
        }
      }
      const pointers: ScenePointer[] = [];
      if (ci !== null) {
        pointers.push({ label: 'i', index: ci * n, axis: 'row' });
        if (cj !== null) pointers.push({ label: 'j', index: ci * n + cj });
      }
      const auxNodes = B.map((v, x) =>
        node(`b${x}`, v ?? '', states[`b${x}`] ?? (v === null ? 'default' : 'sorted')),
      );
      steps.push(
        makeStep(
          t++,
          anchor,
          phase,
          {
            ...gridScene(nodes, n, pointers, `三对角矩阵 A（${n}×${n}）· 只有 |i-j| ≤ 1 的位置非零`),
            aux: { label: `一维数组 B（长度 ${total} = 3n-2）`, nodes: auxNodes, cols: total },
            layout: 'matrix',
          },
          {
            i: ci === null ? '—' : ci,
            j: cj === null ? '—' : cj,
            k: kk === null ? '—' : kk,
            已存个数: stored,
            一维长度: total,
          },
          caption,
        ),
      );
    };

    push('init', '初始化', `n = ${n}，非零元素共 3n-2 = ${total} 个；一维数组 B 预留 ${total} 个单元，按行优先依次填入。`, {}, null, null, null);

    for (let i = 0; i < n; i++) {
      const lo = Math.max(i - 1, 0);
      const hi = Math.min(i + 1, n - 1);
      push('loopI', '逐行处理', `第 ${i} 行只存 j = ${lo} ~ ${hi} 的 ${hi - lo + 1} 个元素，带外的 0 一律跳过。`, {}, i, null, null);
      for (let j = lo; j <= hi; j++) {
        const v = i * n + j + 1;
        push('loopJ', '取矩阵元素', `A[${i}][${j}] = ${v}，|i-j| = ${Math.abs(i - j)} ≤ 1，落在带上，需要压缩存储。`, { [`a${i}_${j}`]: 'compare' }, i, j, null);
        const kk = 2 * i + j;
        push(
          'calc',
          '推导下标',
          `k = 2i + j = 2×${i} + ${j} = ${kk}；第 ${i} 行的三个位置落在 3i-1 ~ 3i+1，${i === 0 ? '首行没有 j = -1，从 0 开始' : `与前面 ${i} 行占用的 ${2 + 3 * (i - 1)} 个单元衔接`}。`,
          {},
          i,
          j,
          kk,
        );
        B[kk] = v;
        stored += 1;
        written.add(`a${i}_${j}`);
        push(
          'write',
          '写入一维数组',
          `B[${kk}] = A[${i}][${j}] = ${v}，已存 ${stored} / ${total} 个元素。`,
          { [`a${i}_${j}`]: 'insert', [`b${kk}`]: 'insert' },
          i,
          j,
          kk,
        );
      }
    }

    push('done', '结束', `三带 ${total} 个元素已全部落入 B[0..${total - 1}]，读取 A[i][j] 只需算一次 2i+j。`, {}, null, null, null);
    return steps;
  },
};
