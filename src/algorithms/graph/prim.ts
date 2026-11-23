import type { AlgorithmMeta, EdgeState, NodeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

/** 固定带权无向图（教材经典算例）：A-B6、A-C1、A-D5、B-C5、B-E3、C-D5、C-E6、C-F4、D-F2、E-F6 */
const VEX = ['A', 'B', 'C', 'D', 'E', 'F'];
const POS: { x: number; y: number }[] = [
  { x: 0.5, y: 0.05 },
  { x: 0.1, y: 0.3 },
  { x: 0.5, y: 0.44 },
  { x: 0.9, y: 0.3 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 },
];
const WEDGES: [number, number, number][] = [
  [0, 1, 6],
  [0, 2, 1],
  [0, 3, 5],
  [1, 2, 5],
  [1, 4, 3],
  [2, 3, 5],
  [2, 4, 6],
  [2, 5, 4],
  [3, 5, 2],
  [4, 5, 6],
];

const eKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

export const primMst: AlgorithmMeta = {
  slug: 'graph/prim',
  title: '图 · Prim 最小生成树',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '每次挑一条连接已选集与未选集的最小权边。',
  complexity: { time: 'O(n²)', space: 'O(n)', extra: '邻接矩阵实现，适合稠密图' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–6），在示例带权无向图上演示从 A 出发的 Prim 算法。',
  defaultInput: [6],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'void Prim(AMGraph G, int u) {' },
      { text: '  int lowcost[MAXV], closest[MAXV];', anchor: 'init' },
      { text: '  for (int i = 0; i < G.vexnum; i++) {' },
      { text: '    lowcost[i] = G.arcs[u][i];' },
      { text: '    closest[i] = u;' },
      { text: '  }' },
      { text: '  lowcost[u] = 0;' },
      { text: '  for (int i = 1; i < G.vexnum; i++) {', anchor: 'loop' },
      { text: '    int k = -1, min = INF;' },
      { text: '    for (int j = 0; j < G.vexnum; j++)', anchor: 'scan' },
      { text: '      if (lowcost[j] != 0 && lowcost[j] < min) { min = lowcost[j]; k = j; }' },
      { text: '    printf("(%c,%c)%d", G.vex[closest[k]], G.vex[k], min);', anchor: 'pick' },
      { text: '    total += min; lowcost[k] = 0;' },
      { text: '    for (int j = 0; j < G.vexnum; j++)', anchor: 'update' },
      { text: '      if (G.arcs[k][j] < lowcost[j]) { lowcost[j] = G.arcs[k][j]; closest[j] = k; }' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def prim(g, u):' },
      { text: '    lowcost = list(g.arcs[u])', anchor: 'init' },
      { text: '    closest = [u] * g.n' },
      { text: '    lowcost[u] = 0' },
      { text: '    for _ in range(g.n - 1):', anchor: 'loop' },
      { text: '        k, best = -1, INF' },
      { text: '        for j in range(g.n):', anchor: 'scan' },
      { text: '            if lowcost[j] and lowcost[j] < best:' },
      { text: '                k, best = j, lowcost[j]' },
      { text: '        print(g.vex[closest[k]], g.vex[k], best)', anchor: 'pick' },
      { text: '        lowcost[k] = 0' },
      { text: '        for j in range(g.n):', anchor: 'update' },
      { text: '            if g.arcs[k][j] < lowcost[j]:' },
      { text: '                lowcost[j], closest[j] = g.arcs[k][j], k' },
      { text: '    # 选出 n-1 条边，生成树完成', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把顶点分成「已选集合 U」和「未选集合 V-U」，用 lowcost 记录每个未选顶点到 U 的最短一条边。每轮从未选顶点里挑 lowcost 最小的那个加入 U，再用它的边去刷新别人的 lowcost。加入 n-1 个顶点后结束。',
      points: [
        'lowcost[j] = 0 表示 j 已加入 U，扫描时要跳过',
        'closest[j] 记录这条最小边在 U 中的另一端，用来输出边',
        '每次加入一个顶点，正好选出一条边，共 n-1 条',
      ],
    },
    {
      heading: '为什么能得到最小生成树',
      body: 'Prim 的正确性来自「割性质」：把顶点分成 U 与 V-U 两部分，横跨这个割的最小权边一定属于某棵最小生成树。Prim 每轮选的正是这条边，因此它选的边集合可以扩充成最小生成树。',
    },
    {
      heading: '复杂度与对比',
      body: '邻接矩阵下每轮扫描 n 个 lowcost，共 n 轮，时间 O(n²)，与边数无关，所以适合稠密图。Kruskal 按边排序再并查集，时间 O(e log e)，更适合稀疏图。',
      points: ['无需排序，靠下标扫描找最小值', '若用堆优化可降到 O(e log n)', '图不连通时若干轮后 lowcost 全为无穷'],
    },
  ],
  quiz: [
    { q: 'lowcost[j] = 0 在本算法中表示什么？', options: ['权值为 0 的边', '顶点 j 已加入生成树', '顶点 j 不可达', 'j 是起点'], answer: 1, explain: '每选入顶点 k 就把 lowcost[k] 置 0，扫描时用它排除已选顶点。' },
    { q: 'Prim 算法一共选出多少条边？', options: ['n 条', 'n-1 条', 'e 条', '不确定'], answer: 1, explain: '每轮加入一个顶点并选一条边，n 个顶点共 n-1 条边。' },
    { q: '示例图从 A 出发，第一条被选出的边是哪条？', options: ['(A,B) 权 6', '(A,C) 权 1', '(A,D) 权 5', '(B,E) 权 3'], answer: 1, explain: '与已选集合 {A} 相连的边中 (A,C) 权值 1 最小，先选它。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || 6, 3), 6);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const wedges = WEDGES.filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const selected: boolean[] = Array(n).fill(false);
    const states: Record<string, NodeState> = {};
    const eStates: Record<string, EdgeState> = {};
    let total = 0;

    const lc = (): number[] => {
      const arr: number[] = Array(n).fill(Infinity);
      for (const [a, b, w] of wedges) {
        if (selected[a] && !selected[b]) arr[b] = Math.min(arr[b], w);
        if (selected[b] && !selected[a]) arr[a] = Math.min(arr[a], w);
      }
      return arr;
    };
    const setOf = () => VEX.slice(0, n).filter((_, i) => selected[i]).join('') || '空';
    const candidate = (v: number, cost: number) => {
      if (selected[v] || !Number.isFinite(cost)) return null;
      const match = wedges.find(([a, b, w]) => w === cost && ((selected[a] && b === v) || (selected[b] && a === v)));
      return match ? VEX[match[0] === v ? match[1] : match[0]] : null;
    };
    let beforeCosts: number[] = [];
    let beforeCandidates: (string | null)[] = [];

    const push = (anchor: string, phase: string, caption: string, roundCost: number | string) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(ids[i], v, POS[i].x, POS[i].y, states[ids[i]] ?? 'default'),
      );
      const edges = wedges.map(([a, b, w]) =>
        edge(ids[a], ids[b], String(w), eStates[eKey(a, b)] ?? 'default', false),
      );
      const cur = lc();
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...graphScene(nodes, edges, `已选集合 U = {${setOf()}}，累计权值 ${total}`),
            primTable: VEX.slice(0, n).map((vertex, index) => ({ vertex,
              lowcost: selected[index] ? 0 : Number.isFinite(cur[index]) ? cur[index] : null,
              candidate: candidate(index, cur[index]), selected: selected[index],
              changed: anchor === 'update' && !selected[index] && (cur[index] !== beforeCosts[index] || candidate(index, cur[index]) !== beforeCandidates[index]),
            })),
          },
          {
            lowcost: VEX.slice(0, n)
              .map((v, i) => `${v}:${selected[i] ? 0 : cur[i] === Infinity ? '∞' : cur[i]}`)
              .join(' '),
            已选集合: setOf(),
            本轮权值: roundCost,
            累计权值: total,
          },
          caption,
        ),
      );
    };

    selected[0] = true;
    states[ids[0]] = 'found';
    push('init', '初始化', '从 A 出发，U = {A}，lowcost 为 A 到各顶点的直接距离。', '—');

    for (let round = 1; round < n; round++) {
      const cur = lc();
      beforeCosts = cur;
      beforeCandidates = cur.map((cost, index) => candidate(index, cost));
      const crossing = wedges.filter(([a, b]) => selected[a] !== selected[b]);
      for (const [a, b] of crossing) eStates[eKey(a, b)] = 'candidate';
      const desc = crossing.map(([a, b, w]) => `(${VEX[a]},${VEX[b]})${w}`).join('、');
      push('scan', '扫描候选边', `横跨 U 与 V-U 的候选边：${desc}，取其中权值最小者。`, '—');

      let v = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        if (!selected[i] && cur[i] < best) {
          best = cur[i];
          v = i;
        }
      }
      const from = wedges.find(([a, b, w]) => ((selected[a] && b === v) || (selected[b] && a === v)) && w === best);
      const u = from ? (from[0] === v ? from[1] : from[0]) : 0;
      eStates[eKey(u, v)] = 'tree';
      selected[v] = true;
      states[ids[v]] = 'found';
      total += best;
      push('pick', '选入最小边', `选出 (${VEX[u]},${VEX[v]}) 权值 ${best}，把 ${VEX[v]} 并入 U。`, best);

      for (const [a, b] of crossing) {
        if (!(a === u && b === v) && !(a === v && b === u)) eStates[eKey(a, b)] = 'reject';
      }
      push('update', '刷新 lowcost', `${VEX[v]} 已并入 U，其余候选边作废；更新 lowcost 后进入下一轮。`, best);
    }
    push('done', '完成', `共选出 ${n - 1} 条边，最小生成树总权值为 ${total}。`, '—');
    return steps;
  },
};
