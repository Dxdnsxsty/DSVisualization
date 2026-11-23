import type { AlgorithmMeta, EdgeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

/** 固定 5 顶点有向带权图：A→B3、A→C8、A→E9、B→C2、B→D5、C→D4、C→E6、D→A7、D→E1、E→B2 */
const VEX = ['A', 'B', 'C', 'D', 'E'];
const POS: { x: number; y: number }[] = [
  { x: 0.07, y: 0.5 },
  { x: 0.35, y: 0.08 },
  { x: 0.35, y: 0.72 },
  { x: 0.68, y: 0.92 },
  { x: 0.9, y: 0.45 },
];
const DEDGES: [number, number, number][] = [
  [0, 1, 3],
  [0, 2, 8],
  [0, 4, 9],
  [1, 2, 2],
  [1, 3, 5],
  [2, 3, 4],
  [2, 4, 6],
  [3, 0, 7],
  [3, 4, 1],
  [4, 1, 2],
];
const INF = Number.POSITIVE_INFINITY;
const show = (v: number) => (v === INF ? '∞' : String(v));

export const floydShortest: AlgorithmMeta = {
  slug: 'graph/floyd',
  title: '图 · Floyd 最短路径',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '逐个把顶点当作中转站，刷新所有顶点对的距离。',
  complexity: { time: 'O(n³)', space: 'O(n²)', extra: '邻接矩阵迭代，允许负权边' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（4–5），在示例有向带权图上演示 Floyd 算法的三层循环。',
  defaultInput: [5],
  input: { min: 4, max: 5, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'void Floyd(MatGraph G) {' },
      { text: '  int D[MAXV][MAXV];  // D 初值即邻接矩阵', anchor: 'init' },
      { text: '  for (int i = 0; i < G.n; i++)' },
      { text: '    for (int j = 0; j < G.n; j++)' },
      { text: '      D[i][j] = G.edges[i][j];' },
      { text: '  for (int k = 0; k < G.n; k++) {', anchor: 'k' },
      { text: '    for (int i = 0; i < G.n; i++)', anchor: 'ij' },
      { text: '      for (int j = 0; j < G.n; j++)' },
      { text: '        if (D[i][k] != INF && D[k][j] != INF &&' },
      { text: '            D[i][j] > D[i][k] + D[k][j])', anchor: 'cmp' },
      { text: '          D[i][j] = D[i][k] + D[k][j];', anchor: 'update' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def floyd(g):' },
      { text: '    D = [row[:] for row in g.arcs]  # 初值即邻接矩阵', anchor: 'init' },
      { text: '    for k in range(g.n):', anchor: 'k' },
      { text: '        for i in range(g.n):', anchor: 'ij' },
      { text: '            for j in range(g.n):' },
      { text: '                if D[i][k] == INF or D[k][j] == INF:' },
      { text: '                    continue' },
      { text: '                if D[i][j] > D[i][k] + D[k][j]:', anchor: 'cmp' },
      { text: '                    D[i][j] = D[i][k] + D[k][j]', anchor: 'update' },
      { text: '    return D', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '用矩阵 D 记录每对顶点之间的当前最短距离，初值就是邻接矩阵（自己到自己为 0，无边为 ∞）。然后让每个顶点 k 轮流当一次「中转站」：若 D[i][k] + D[k][j] 比 D[i][j] 更小，说明绕道 k 更近，就更新它。',
      points: [
        'k 必须放在最外层：每轮加入一个新的中转顶点，前面轮次的结果才能被复用',
        'i、j 的顺序无所谓，但 k 换到内层会漏掉某些组合',
        '完整算法也检查对角线。若 D[i][i] < 0，说明存在负权回路；当前示例无负权回路，动画省略对角线和 i = k 或 j = k 的无变化步骤。',
      ],
    },
    {
      heading: '为什么这样递推是对的',
      body: '把「允许使用的中转顶点集合」视为阶段：第 k 轮结束时，D[i][j] 表示只允许经过 {0..k} 这些顶点的最短距离。要么不经过 k（就是上一轮的值），要么经过 k（拆成 i→k 与 k→j 两段），两者取小，正是代码里的那次比较。',
    },
    {
      heading: '复杂度与对比',
      body: '三层循环各 n 次，时间 O(n³)，空间 O(n²)。它一次求出所有顶点对的最短路径，代码极短，适合稠密图与小规模数据。Dijkstra 每次只能求单源，跑 n 次是 O(n³)，但稀疏图上用堆优化更快；只求单源且无负权时优先用 Dijkstra。',
      points: ['记录 path[i][j] 即可还原整条路径', '允许负权边，但不能有负权回路', '三重循环中 D[i][k]、D[k][j] 在第 k 轮不会变，可省去 i==k 或 j==k 的判断'],
    },
  ],
  quiz: [
    { q: 'Floyd 三层循环中，为什么 k 必须放在最外层？', options: ['写法习惯', 'k 表示阶段，内层才能复用已求出的中转结果', '放在内层会死循环', '放在内层无法编译'], answer: 1, explain: '每轮 k 引入一个新的中转顶点，只有按阶段推进才能保证 D 的值是当前阶段的正确答案。' },
    { q: 'D[i][i] 出现负数说明什么？', options: ['计算溢出', '存在负权回路', '图不连通', 'i 没有自环'], answer: 1, explain: '绕一圈回到自己还能让距离变小，说明环上权值之和为负，最短路径不存在。' },
    { q: '示例图求 A 到 D 的最短路径，长度是？', options: ['5', '6', '8', '9'], answer: 2, explain: 'A→B→D 权值为 3+5 = 8；A→B→C→D 是 9，A→E→B→D 是 16，因此最短为 8。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || 5, 4), 5);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const dedges = DEDGES.filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const d: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)),
    );
    for (const [a, b, w] of dedges) d[a][b] = Math.min(d[a][b], w);
    let updates = 0;
    let ck = -1;
    let ci = -1;
    let cj = -1;
    let improved = false;
    let dText = '—';

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(
          ids[i],
          v,
          POS[i].x,
          POS[i].y,
          i === ck ? 'active' : i === ci ? 'compare' : i === cj ? (improved ? 'min' : 'visited') : 'default',
        ),
      );
      const edges = dedges.map(([a, b, w]) => {
        let st: EdgeState = 'default';
        if (a === ci && b === cj) st = improved ? 'tree' : 'candidate';
        else if ((a === ci && b === ck) || (a === ck && b === cj)) st = 'active';
        return edge(ids[a], ids[b], String(w), st, true);
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...graphScene(nodes, edges, `中转顶点 ${ck >= 0 ? VEX[ck] : '—'}　已更新 ${updates} 处`),
            distanceMatrix: { labels: VEX.slice(0, n), values: d.map((row) => row.map(show)),
              k: ck < 0 ? null : ck, i: ci < 0 ? null : ci, j: cj < 0 ? null : cj, updated: improved },
          },
          {
            当前k: ck >= 0 ? VEX[ck] : '—',
            当前i: ci >= 0 ? VEX[ci] : '—',
            当前j: cj >= 0 ? VEX[cj] : '—',
            'D[i][j]': dText,
            已更新: updates,
          },
          caption,
        ),
      );
    };

    push('init', '初始化距离矩阵', 'D 的初值就是邻接矩阵：自己到自己为 0，没有直接边的记 ∞，其余为边权。');
    for (let mid = 0; mid < n; mid++) {
      ck = mid;
      ci = -1;
      cj = -1;
      improved = false;
      dText = '—';
      push(
        'k',
        '选择中转顶点',
        `第 ${mid + 1} 轮以 ${VEX[mid]} 为中转：凡是 D[i][${VEX[mid]}] + D[${VEX[mid]}][j] 更小的 D[i][j] 都要更新。`,
      );

      for (let i = 0; i < n; i++) {
        if (i === mid || d[i][mid] === INF) continue;
        for (let j = 0; j < n; j++) {
          if (j === mid || j === i || d[mid][j] === INF) continue;
          ci = i;
          cj = j;
          const cand = d[i][mid] + d[mid][j];
          const before = d[i][j];
          if (cand < before) {
            d[i][j] = cand;
            updates += 1;
            improved = true;
            dText = `${show(before)} → ${show(cand)}`;
            push(
              'update',
              '更新 D[i][j]',
              `D[${VEX[i]}][${VEX[mid]}] + D[${VEX[mid]}][${VEX[j]}] = ${d[i][mid]} + ${d[mid][j]} = ${cand} < ${show(before)}，绕 ${VEX[mid]} 更短，更新该值。`,
            );
            improved = false;
          } else {
            improved = false;
            dText = show(before);
            push(
              'cmp',
              '比较无需更新',
              `经 ${VEX[mid]} 绕行得 ${cand}，不短于原来的 ${show(before)}，D[${VEX[i]}][${VEX[j]}] 保持不变。`,
            );
          }
        }
      }
    }

    ck = -1;
    ci = -1;
    cj = -1;
    improved = false;
    dText = '—';
    push(
      'done',
      '完成',
      `k 遍历完毕，D 中每一项都已是最终最短距离，A 到各顶点的距离为 ${VEX.slice(1, n)
        .map((v, i) => `${v}=${show(d[0][i + 1])}`)
        .join('，')}。`,
    );
    return steps;
  },
};
