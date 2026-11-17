import type { AlgorithmMeta, EdgeState, NodeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

/** 与 Prim 共用同一张带权无向图，便于对照两种最小生成树算法。 */
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

export const kruskalMst: AlgorithmMeta = {
  slug: 'graph/kruskal',
  title: '图 · Kruskal 最小生成树',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '边按权值从小到大挑，成环的边直接丢掉。',
  complexity: { time: 'O(e log e)', space: 'O(n)', extra: '瓶颈在边排序；适合稀疏图' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–6），边按权值升序逐条考察，用并查集判断是否成环。',
  defaultInput: [6],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'int Find(int parent[], int x) {' },
      { text: '  while (parent[x] != x) x = parent[x];' },
      { text: '  return x;' },
      { text: '}' },
      { text: 'void Kruskal(Edge E[], int e, int n) {' },
      { text: '  int parent[MAXV], cnt = 0;', anchor: 'init' },
      { text: '  for (int i = 0; i < n; i++) parent[i] = i;' },
      { text: '  sort(E, E + e);  // 按权值升序' },
      { text: '  for (int i = 0; i < e && cnt < n - 1; i++) {', anchor: 'loop' },
      { text: '    int ra = Find(parent, E[i].u);', anchor: 'check' },
      { text: '    int rb = Find(parent, E[i].v);' },
      { text: '    if (ra == rb) continue;', anchor: 'reject' },
      { text: '    parent[ra] = rb;', anchor: 'union' },
      { text: '    printf("(%c,%c)%d ", vex[E[i].u], vex[E[i].v], E[i].w);' },
      { text: '    cnt++;' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def find(parent, x):' },
      { text: '    while parent[x] != x:' },
      { text: '        x = parent[x]' },
      { text: '    return x' },
      { text: 'def kruskal(g):' },
      { text: '    parent = list(range(g.n))', anchor: 'init' },
      { text: '    edges = sorted(g.edges, key=lambda e: e[2])' },
      { text: '    cnt = 0' },
      { text: '    for u, v, w in edges:', anchor: 'loop' },
      { text: '        ra = find(parent, u)', anchor: 'check' },
      { text: '        rb = find(parent, v)' },
      { text: '        if ra == rb:', anchor: 'reject' },
      { text: '            continue' },
      { text: '        parent[ra] = rb', anchor: 'union' },
      { text: '        print(u, v, w)' },
      { text: '        cnt += 1' },
      { text: '        if cnt == g.n - 1:', anchor: 'done' },
      { text: '            break' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把所有边按权值从小到大排序，依次考察每一条边：若它的两个端点当前不属于同一个连通分量，就把它选入生成树并把两个分量合并；否则这条边会让生成树出现回路，直接丢弃。选够 n-1 条边即结束。',
      points: [
        '判断「是否成环」等价于判断两端是否已在同一连通分量',
        '并查集用 parent 数组表示森林，Find 求根，根相同即同分量',
        '结束时若选不满 n-1 条边，说明原图不连通',
      ],
    },
    {
      heading: '为什么正确',
      body: '排序后每条边都是「当前能选的最小边」。若它与已选边构成环，说明两端已被更小（或相等）的边连通，这条边必不出现在任何最小生成树中；否则由割性质可知它一定属于某棵最小生成树。',
    },
    {
      heading: '复杂度与对比',
      body: '排序占 O(e log e)，并查集近似 O(e·α(n))，总时间 O(e log e)，主要开销在排序，因此适合稀疏图。Prim 是 O(n²)，与边数无关，适合稠密图。两者在最坏情况下都可能得到不同的最小生成树，但总权值相同。',
      points: ['无需邻接矩阵，只要边表', '路径压缩可让 Find 接近 O(1)', '权值相等时选边次序不同，生成树形状可能不同'],
    },
  ],
  quiz: [
    { q: 'Kruskal 判断一条边能否选入的依据是？', options: ['边是否为当前最小', '两端是否在同一连通分量', '边是否与已有边相邻', '顶点度数是否超标'], answer: 1, explain: '两端已在同一分量说明选它必成环，因此丢弃；否则选入并合并分量。' },
    { q: 'Kruskal 的时间复杂度主要取决于？', options: ['顶点数', '边排序', '并查集层数', '图的连通分量数'], answer: 1, explain: '瓶颈是对 e 条边排序，O(e log e)，并查集部分远小于它。' },
    { q: '示例图按权值考察，第一条被丢弃的边是哪条？', options: ['(A,D) 权 5', '(B,C) 权 5', '(A,B) 权 6', '(C,E) 权 6'], answer: 0, explain: '选入 A-C、D-F、B-E、C-F 后 A 与 D 已同属一个分量，(A,D) 会成环被丢弃。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || 6, 3), 6);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const wedges = WEDGES.filter(([a, b]) => a < n && b < n).sort((p, q) => p[2] - q[2]);
    const steps: TraceStep[] = [];
    let k = 0;
    const states: Record<string, NodeState> = {};
    const eStates: Record<string, EdgeState> = {};
    const parent: number[] = Array.from({ length: n }, (_, i) => i);

    const find = (x: number): number => {
      let r = x;
      while (parent[r] !== r) r = parent[r];
      let c = x;
      while (parent[c] !== r) {
        const next = parent[c];
        parent[c] = r;
        c = next;
      }
      return r;
    };
    const comps = (): string => {
      const groups = new Map<number, string[]>();
      for (let i = 0; i < n; i++) {
        const r = find(i);
        if (!groups.has(r)) groups.set(r, []);
        groups.get(r)!.push(VEX[i]);
      }
      return [...groups.values()].map((g) => `{${g.join('')}}`).join(' ');
    };

    let picked = 0;
    let total = 0;

    const push = (anchor: string, phase: string, caption: string, curEdge: string, curWeight: number | string) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(ids[i], v, POS[i].x, POS[i].y, states[ids[i]] ?? 'default'),
      );
      const baseEdges = wedges.map(([a, b, w]) =>
        edge(ids[a], ids[b], String(w), eStates[eKey(a, b)] ?? 'default', false),
      );
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          graphScene(nodes, baseEdges, `已选 ${picked} 条边，累计权值 ${total}`),
          {
            当前边: curEdge,
            权值: curWeight,
            已选边数: picked,
            连通分量: comps(),
            累计权值: total,
          },
          caption,
        ),
      );
    };

    push('init', '边排序', `把 ${wedges.length} 条边按权值升序排列，依次考察。`, '—', '—');

    for (const [a, b, w] of wedges) {
      if (picked === n - 1) break;
      eStates[eKey(a, b)] = 'active';
      states[ids[a]] = 'active';
      states[ids[b]] = 'active';
      const ra = find(a);
      const rb = find(b);
      push(
        'check',
        '考察当前边',
        `考察 (${VEX[a]},${VEX[b]}) 权值 ${w}：两端当前的根分别是 ${VEX[ra]} 与 ${VEX[rb]}，${
          ra === rb ? '已在同一连通分量，选它会成环' : '不在同一分量，可以选入'
        }。`,
        `(${VEX[a]},${VEX[b]})`,
        w,
      );
      if (ra === rb) {
        eStates[eKey(a, b)] = 'reject';
        states[ids[a]] = 'default';
        states[ids[b]] = 'default';
        push('reject', '丢弃成环边', `两端已在同一连通分量，加入 (${VEX[a]},${VEX[b]}) 会形成回路，丢弃。`, `(${VEX[a]},${VEX[b]})`, w);
      } else {
        parent[ra] = rb;
        picked += 1;
        total += w;
        eStates[eKey(a, b)] = 'tree';
        states[ids[a]] = 'found';
        states[ids[b]] = 'found';
        push('union', '选入并合并', `两端不在同一连通分量，选入该边，并把两个分量合并，已选 ${picked} 条。`, `(${VEX[a]},${VEX[b]})`, w);
      }
    }
    push('done', '完成', `已选满 ${picked} 条边，最小生成树总权值为 ${total}。`, '—', '—');
    return steps;
  },
};
