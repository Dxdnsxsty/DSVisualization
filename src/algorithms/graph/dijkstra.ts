import type { AlgorithmMeta, EdgeState, NodeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';
import { GRAPH_SIZE_INPUT } from '../../engine/input';

/** 固定有向带权图（权值全部非负）：A→B2、A→C5、B→C2、B→D6、C→D2、C→E7、D→E1、D→F4、E→F3 */
const VEX = ['A', 'B', 'C', 'D', 'E', 'F'];
const POS: { x: number; y: number }[] = [
  { x: 0.06, y: 0.5 },
  { x: 0.3, y: 0.1 },
  { x: 0.3, y: 0.9 },
  { x: 0.62, y: 0.9 },
  { x: 0.92, y: 0.5 },
  { x: 0.62, y: 0.1 },
];
const DEDGES: [number, number, number][] = [
  [0, 1, 2],
  [0, 2, 5],
  [1, 2, 2],
  [1, 3, 6],
  [2, 3, 2],
  [2, 4, 7],
  [3, 4, 1],
  [3, 5, 4],
  [4, 5, 3],
];

export const dijkstraShortest: AlgorithmMeta = {
  slug: 'graph/dijkstra',
  title: '图 · Dijkstra 最短路径',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '每轮锁定 dist 最小的顶点，再松弛它的出边。',
  complexity: { time: 'O(n²)', space: 'O(n)', extra: '权值必须非负' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–6），选择可达或不可达案例；点击图中顶点或计算表按钮查看从 A 出发的路径。',
  defaultInput: [6],
  input: GRAPH_SIZE_INPUT,
  graphCases: [
    { id: 0, label: '全部可达', description: '从 A 出发，所有顶点都有最短路径。' },
    { id: 1, label: '目标不可达', description: '最后一个顶点没有入边，距离保持 ∞；观察算法如何结束。' },
  ],
  code: {
    cpp: [
      { text: 'void Dijkstra(MatGraph G, int s) {' },
      { text: '  int dist[MAXV], S[MAXV], pred[MAXV];', anchor: 'init' },
      { text: '  for (int i = 0; i < G.n; i++) {' },
      { text: '    dist[i] = INF; S[i] = 0; pred[i] = -1;' },
      { text: '  }' },
      { text: '  dist[s] = 0;' },
      { text: '  for (int i = 0; i < G.n; i++) {', anchor: 'loop' },
      { text: '    int u = -1, min = INF;' },
      { text: '    for (int j = 0; j < G.n; j++)', anchor: 'pick' },
      { text: '      if (!S[j] && dist[j] < min) { min = dist[j]; u = j; }' },
      { text: '    if (u == -1) break; // 剩余顶点均不可达', anchor: 'unreachable' },
      { text: '    S[u] = 1;' },
      { text: '    for (int v = 0; v < G.n; v++)', anchor: 'relax' },
      { text: '      if (!S[v] && G.edges[u][v] < INF && dist[u] + G.edges[u][v] < dist[v]) {' },
      { text: '        dist[v] = dist[u] + G.edges[u][v]; pred[v] = u;', anchor: 'update' },
      { text: '      }' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def dijkstra(g, s):' },
      { text: '    dist = [INF] * g.n', anchor: 'init' },
      { text: '    S = [False] * g.n' },
      { text: '    pred = [-1] * g.n' },
      { text: '    dist[s] = 0' },
      { text: '    for _ in range(g.n):', anchor: 'loop' },
      { text: '        u, best = -1, INF' },
      { text: '        for j in range(g.n):', anchor: 'pick' },
      { text: '            if not S[j] and dist[j] < best:' },
      { text: '                u, best = j, dist[j]' },
      { text: '        if u == -1:', anchor: 'unreachable' },
      { text: '            break' },
      { text: '        S[u] = True' },
      { text: '        for v in range(g.n):', anchor: 'relax' },
      { text: '            if S[v] or g.arcs[u][v] == INF:' },
      { text: '                continue' },
      { text: '            if dist[u] + g.arcs[u][v] < dist[v]:' },
      { text: '                dist[v] = dist[u] + g.arcs[u][v]; pred[v] = u', anchor: 'update' },
      { text: '    return dist, pred', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '维护 dist 数组（起点到各顶点的当前最短估计）和集合 S（已确定最短路径的顶点）。每轮从 V-S 中选 dist 最小的顶点 u 并入 S，再用 u 的出边去尝试「绕道」：若 dist[u]+w 更小，就更新 dist[v]。因为所有边权非负，u 的 dist 一旦被选中就不会再变小。',
      points: [
        'dist 最小者出队即最终值，这是贪心选择正确的前提',
        '只松弛从 u 出发的边，入边无需处理',
        '边权有负数时该算法失效，要改用 Bellman-Ford',
      ],
    },
    {
      heading: '为什么必须非负',
      body: '若存在负权边，已确定的顶点还可能通过后续负权边被缩短，贪心前提被破坏。例如 A→B=2、A→C=5、C→B=-4，选出 B 后才发现经 C 更短。',
    },
    {
      heading: '复杂度与对比',
      body: '邻接矩阵下每轮扫描 n 个 dist、松弛 n 条边，共 n 轮，时间 O(n²)。用邻接表 + 二叉堆可优化到 O((n+e) log n)。求所有顶点对之间的最短路用 Floyd，O(n³)。',
      points: ['稠密图用矩阵 O(n²) 反而更简单', 'pred 数组记录前驱，可沿前驱反向恢复路径', '本演示先将距离设为 ∞，再令源点距离为 0，通过松弛更新其他距离'],
    },
  ],
  quiz: [
    { q: 'Dijkstra 每轮被并入 S 的顶点满足什么条件？', options: ['编号最小', 'dist 最小且未确定', '度数最大', '出边最少'], answer: 1, explain: '从 V-S 中选 dist 最小的顶点，它的最短距离此刻已可确定。' },
    { q: '为什么 Dijkstra 不能处理负权边？', options: ['数组无法存负数', '负权会让已确定的 dist 再变小，贪心前提失效', '会导致死循环', '无法保证图连通'], answer: 1, explain: '非负权保证后续绕道不会更短，负权破坏这一性质。' },
    { q: '示例图从 A 出发，dist[F] 最终是多少？', options: ['7', '9', '10', '12'], answer: 2, explain: '路径 A→B→C→D→F 权值为 2+2+2+4 = 10，比经 E 的 11 更短。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || 6, 3), 6);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const dedges = DEDGES.filter(([a, b]) => a < n && b < n && (input[1] !== 1 || b !== n - 1));
    const steps: TraceStep[] = [];
    let k = 0;
    const dist: number[] = Array(n).fill(Infinity);
    const settled: boolean[] = Array(n).fill(false);
    const pred: number[] = Array(n).fill(-1);
    const examined = new Set<string>();
    const states: Record<string, NodeState> = {};

    const push = (anchor: string, phase: string, caption: string, u: number, w: number | string, changed = -1) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(ids[i], v, POS[i].x, POS[i].y, states[ids[i]] ?? 'default'),
      );
      const edges = dedges.map(([a, b, wt]) => {
        const key = `${a}>${b}`;
        const st: EdgeState = pred[b] === a ? 'tree' : examined.has(key) ? 'reject' : 'default';
        return edge(ids[a], ids[b], String(wt), st, true);
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...graphScene(nodes, edges, `已确定 ${settled.filter(Boolean).length} / ${n} 个顶点`),
            shortestPath: {
              source: ids[0], complete: anchor === 'done',
              rows: VEX.slice(0, n).map((vertex, index) => {
                const path: string[] = [];
                if (Number.isFinite(dist[index])) {
                  for (let at = index; at !== -1; at = pred[at]) path.unshift(ids[at]);
                }
                return { id: ids[index], vertex, distance: Number.isFinite(dist[index]) ? dist[index] : null,
                  predecessor: pred[index] < 0 ? null : VEX[pred[index]], settled: settled[index], changed: index === changed, path };
              }),
            },
          },
          {
            dist: VEX.slice(0, n)
              .map((v, i) => `${v}:${dist[i] === Infinity ? '∞' : dist[i]}`)
              .join(' '),
            已确定S: VEX.slice(0, n).filter((_, i) => settled[i]).join('') || '空',
            前驱: VEX.slice(0, n).map((v, i) => `${v}:${pred[i] < 0 ? '—' : VEX[pred[i]]}`).join(' '),
            本轮顶点: u >= 0 ? VEX[u] : '—',
            边权: w,
          },
          caption,
        ),
      );
    };

    dist[0] = 0;
    states[ids[0]] = 'active';
    push('init', '初始化', 'dist[A] = 0，其余为 ∞；集合 S 为空，准备逐轮确定最短路径。', 0, '—', 0);

    for (let round = 0; round < n; round++) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        if (!settled[i] && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u === -1) {
        push('unreachable', '剩余顶点不可达', '未确定顶点的距离均为 ∞，从 A 无法到达它们，结束选点。', -1, '—');
        break;
      }
      settled[u] = true;
      states[ids[u]] = 'found';
      push('pick', '选出最小 dist', `未确定顶点中 dist 最小的是 ${VEX[u]} = ${best}，并入集合 S。`, u, '—');

      for (const [a, b, w] of dedges) {
        if (a !== u || settled[b]) continue;
        examined.add(`${a}>${b}`);
        const cand = dist[u] + w;
        if (cand < dist[b]) {
          const before = Number.isFinite(dist[b]) ? String(dist[b]) : '∞';
          dist[b] = cand;
          pred[b] = a;
          if (!settled[b]) states[ids[b]] = 'active';
          push('update', '松弛成功', `经 ${VEX[u]} 到 ${VEX[b]}：${dist[u]} + ${w} = ${cand} < ${before}，更新 dist[${VEX[b]}]，前驱改为 ${VEX[u]}。`, u, w, b);
        } else {
          push('relax', '松弛失败', `经 ${VEX[u]} 到 ${VEX[b]}：${dist[u]} + ${w} = ${cand} 并不更小，dist[${VEX[b]}] 保持 ${dist[b]}。`, u, w);
        }
      }
    }
    push('done', '完成', `可达顶点的最短距离已确定：${VEX.slice(0, n).map((v, i) => `${v}=${Number.isFinite(dist[i]) ? dist[i] : '∞（不可达）'}`).join('，')}。点击顶点或表中按钮查看路径。`, -1, '—');
    return steps;
  },
};
