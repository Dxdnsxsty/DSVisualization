import type { AlgorithmMeta, NodeState, SceneNode, ScenePointer, TraceStep } from '../../engine/types';
import { gridScene, makeStep, node } from '../../engine/scene';

/** 对称矩阵：A[i][j] == A[j][i]，只需存下三角（含对角线）。 */
export const symmetricMatrix: AlgorithmMeta = {
  slug: 'array/symmetric-matrix',
  title: '对称矩阵 · 压缩存储',
  chapter: '第 6 章 数组和广义表',
  category: 'ch6',
  summary: '下三角按行优先存，k 一次算出。',
  complexity: { time: 'O(n²)', space: 'O(n²)', extra: '存储量由 n² 降到 n(n+1)/2' },
  difficulty: '入门',
  inputHint: '输入矩阵阶数 n（3–6），演示 4×4 对称矩阵按行优先压缩到一维数组的过程。',
  defaultInput: [4],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define N 4' },
      { text: 'void StoreSymmetric(int A[][N], int B[]) {' },
      { text: '  int count = 0;', anchor: 'init' },
      { text: '  for (int i = 0; i < N; i++) {', anchor: 'loopI' },
      { text: '    for (int j = 0; j <= i; j++) {', anchor: 'loopJ' },
      { text: '      int k = i * (i + 1) / 2 + j;', anchor: 'calc' },
      { text: '      B[k] = A[i][j];', anchor: 'write' },
      { text: '      count++;' },
      { text: '    }' },
      { text: '  }' },
      { text: '  // 下三角共 N(N+1)/2 个元素', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'N = 4' },
      { text: 'def store_symmetric(a):' },
      { text: '    total = N * (N + 1) // 2' },
      { text: '    b = [0] * total', anchor: 'init' },
      { text: '    for i in range(N):', anchor: 'loopI' },
      { text: '        for j in range(i + 1):', anchor: 'loopJ' },
      { text: '            k = i * (i + 1) // 2 + j', anchor: 'calc' },
      { text: '            b[k] = a[i][j]', anchor: 'write' },
      { text: '    # 下三角共 N(N+1)/2 个元素', anchor: 'done' },
      { text: '    return b' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '对称矩阵满足 A[i][j] == A[j][i]，上三角与下三角完全重复。因此只存下三角（含主对角线）的 n(n+1)/2 个元素，需要读上三角时按下标交换去取。存储量从 n² 降到约 n²/2。',
      points: [
        '按行优先：先存第 0 行 1 个，再第 1 行 2 个……累加得到偏移',
        '下标公式 k = i(i+1)/2 + j，仅在 i ≥ j 时使用',
        'i < j 时先交换：A[i][j] = B[j(j+1)/2 + i]',
      ],
    },
    {
      heading: '公式怎么来的',
      body: '第 0 行到第 i-1 行共有 1+2+…+i = i(i+1)/2 个元素，这就是第 i 行首元素的下标；行内再偏移 j 个，即得 k = i(i+1)/2 + j。整个映射是一次算术运算，所以压缩后仍然是随机存取，时间复杂度 O(1)。',
      points: ['i(i+1)/2 必须用整数除法，不要写成 0.5*i*(i+1)', '行列从 0 开始计数；若题目从 1 开始，公式要相应改写'],
    },
    {
      heading: '易错点',
      body: '最容易错的是 i、j 方向写反：把上三角也按下三角公式存会覆盖数据；其次是行列从 1 开始计数时忘记减去 1。压缩存储只减少空间，不改变访问方式，逻辑上仍是二维的。',
    },
  ],
  quiz: [
    { q: 'n 阶对称矩阵压缩存储需要多少个单元？', options: ['n²', 'n(n+1)/2', 'n(n-1)/2', 'n'], answer: 1, explain: '下三角含对角线共 1+2+…+n = n(n+1)/2 个元素。' },
    { q: '按行优先存下三角，A[3][2]（从 0 计数）的一维下标是？', options: ['6', '7', '8', '5'], answer: 2, explain: 'k = 3×4/2 + 2 = 6 + 2 = 8。' },
    { q: '访问上三角元素 A[1][3] 时应该？', options: ['直接存进 B[1×3+3]', '按 k = 3×4/2 + 1 访问 B', '不存在该元素', '重新分配空间'], answer: 1, explain: '利用对称性转为下三角 A[3][1]，k = 3×4/2 + 1 = 7。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const n = Math.min(Math.max(Math.trunc(input[0] || 4), 3), 6);
    const total = (n * (n + 1)) / 2;
    const val = (i: number, j: number): number => (i <= j ? i * n + j : j * n + i) + 1;
    const B: (number | null)[] = Array.from({ length: total }, () => null);
    let stored = 0;
    let t = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState> = {},
      ci: number | null = null,
      cj: number | null = null,
    ) => {
      const nodes: SceneNode[] = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          nodes.push(node(`a${i}_${j}`, val(i, j), states[`a${i}_${j}`] ?? 'default'));
        }
      }
      const pointers: ScenePointer[] = [];
      if (ci !== null) pointers.push({ label: 'i', index: ci * n });
      if (ci !== null && cj !== null) pointers.push({ label: 'j', index: ci * n + cj });
      const auxNodes = B.map((v, x) =>
        node(`b${x}`, v ?? '', states[`b${x}`] ?? (v === null ? 'default' : 'sorted')),
      );
      steps.push(
        makeStep(
          t++,
          anchor,
          phase,
          {
            ...gridScene(nodes, n, pointers, `对称矩阵 A（${n}×${n}）· 只存下三角，共 ${total} 个元素`),
            aux: { label: `一维数组 B（长度 ${total}）`, nodes: auxNodes, cols: total },
          },
          {
            i: ci === null ? '—' : ci,
            j: cj === null ? '—' : cj,
            k: stored,
            已存个数: stored,
            一维长度: total,
          },
          caption,
        ),
      );
    };

    push('init', '初始化', `n = ${n}，下三角共 ${total} 个元素；一维数组 B 预留 ${total} 个单元，按行优先依次填入。`);
    for (let i = 0; i < n; i++) {
      push('loopI', '逐行压缩', `处理第 ${i} 行：只需存 j = 0..${i} 共 ${i + 1} 个元素，上三角由对称性得到。`, {}, i, null);
      for (let j = 0; j <= i; j++) {
        const kk = (i * (i + 1)) / 2 + j;
        const v = val(i, j);
        push('loopJ', '逐行压缩', `取第 ${i} 行第 ${j} 列的元素 A[${i}][${j}] = ${v}。`, {}, i, j);
        push('calc', '计算下标', `k = i(i+1)/2 + j = ${i}×${i + 1}/2 + ${j} = ${kk}，前 ${i} 行共 ${(i * (i + 1)) / 2} 个元素。`, {}, i, j);
        B[kk] = v;
        stored += 1;
        push(
          'write',
          '写入一维数组',
          `B[${kk}] = A[${i}][${j}] = ${v}；与它对称的 A[${j}][${i}] 不再重复存储。`,
          { [`a${i}_${j}`]: 'insert', [`b${kk}`]: 'insert' },
          i,
          j,
        );
      }
    }
    push('done', '结束', `下三角 ${total} 个元素已全部落入 B[0..${total - 1}]，随机访问仍是一次算术运算。`);
    return steps;
  },
};
