import type { AlgorithmMeta, EdgeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';
import { customGraphInput, decodeCustomGraph } from '../../engine/structure-input';

/** 固定 5 顶点有向带权图（含负权边，但不存在负权回路）：A→B6、A→C7、B→C8、B→D5、B→E-4、C→D-3、D→E9、E→C7 */
const VEX = ['A', 'B', 'C', 'D', 'E'];
const POS: { x: number; y: number }[] = [
  { x: 0.07, y: 0.5 },
  { x: 0.33, y: 0.1 },
  { x: 0.36, y: 0.78 },
  { x: 0.66, y: 0.92 },
  { x: 0.92, y: 0.3 },
];
const DEDGES: [number, number, number][] = [
  [0, 1, 6],
  [0, 2, 7],
  [1, 2, 8],
  [1, 3, 5],
  [1, 4, -4],
  [2, 3, -3],
  [3, 4, 9],
  [4, 2, 7],
];
const INF = Number.POSITIVE_INFINITY;
const show = (v: number) => (v === INF ? '∞' : String(v));

export const bellmanFord: AlgorithmMeta = {
  slug: 'graph/bellman-ford',
  title: '图 · Bellman-Ford 最短路径',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '每轮松弛全部边，无更新时提前结束，再检查源点可达的负权回路。',
  complexity: { time: 'O(n·e)', space: 'O(n)', extra: '可处理负权边，并能判负权回路' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–5），最多进行 n-1 轮松弛；一轮无更新时提前结束，再检查负权回路。',
  defaultInput: [5],
  input: customGraphInput('weighted-signed', { min: 3, max: 5, minLen: 1, maxLen: 1, random: () => [3 + Math.floor(Math.random() * 3)] }),
  customGraph: 'weighted-signed',
  code: {
    cpp: [
      { text: 'bool BellmanFord(Edge E[], int m, int n, int s) {' },
      { text: '  int dist[MAXV], pred[MAXV];', anchor: 'init' },
      { text: '  for (int i = 0; i < n; i++) { dist[i] = INF; pred[i] = -1; }' },
      { text: '  dist[s] = 0;' },
      { text: '  for (int r = 1; r < n; r++) {', anchor: 'round' },
      { text: '    int changed = 0;' },
      { text: '    for (int e = 0; e < m; e++) {', anchor: 'relax' },
      { text: '      int u = E[e].u, v = E[e].v, w = E[e].w;' },
      { text: '      if (dist[u] != INF && dist[u] + w < dist[v]) {' },
      { text: '        dist[v] = dist[u] + w; pred[v] = u; changed = 1;' },
      { text: '      }' },
      { text: '    }' },
      { text: '    if (!changed) break;  // 已经收敛，提前结束', anchor: 'quiet' },
      { text: '  }' },
      { text: '  for (int e = 0; e < m; e++)', anchor: 'check' },
      { text: '    if (dist[E[e].u] != INF && dist[E[e].u] + E[e].w < dist[E[e].v])' },
      { text: '      return false;  // 存在源点可达的负权回路', anchor: 'negative' },
      { text: '  return true;  // 无源点可达的负权回路', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def bellman_ford(n, edges, s):' },
      { text: '    dist = [INF] * n', anchor: 'init' },
      { text: '    pred = [-1] * n' },
      { text: '    dist[s] = 0' },
      { text: '    for r in range(1, n):', anchor: 'round' },
      { text: '        changed = False' },
      { text: '        for u, v, w in edges:', anchor: 'relax' },
      { text: '            if dist[u] != INF and dist[u] + w < dist[v]:' },
      { text: '                dist[v] = dist[u] + w' },
      { text: '                pred[v] = u' },
      { text: '                changed = True' },
      { text: '        if not changed:  # 已经收敛，提前结束', anchor: 'quiet' },
      { text: '            break' },
      { text: '    for u, v, w in edges:', anchor: 'check' },
      { text: '        if dist[u] != INF and dist[u] + w < dist[v]:' },
      { text: '            return None  # 存在源点可达的负权回路', anchor: 'negative' },
      { text: '    return dist', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '松弛一条边 u→v 就是问「从起点先到 u，再走这条边，会不会比现在的 dist[v] 更短」。Bellman-Ford 把图中所有边都松弛一遍称为一轮，最多进行 n-1 轮；若某一整轮没有更新，可以提前结束。不存在源点可达的负权回路时，最短路径可以取为至多 n-1 条边的简单路径，因此这些轮次足以求出最短距离。',
      points: [
        '每轮必须遍历全部边，顺序不影响正确性，只影响同一轮内能否提前用上新值',
        '额外检查时若仍有源点可达的边能松弛，说明存在可达负权回路，相关顶点的最短路径无定义',
        'dist 的初值是「起点 0、其余 ∞」，不是邻接矩阵的一行',
      ],
    },
    {
      heading: '为什么能处理负权边',
      body: '它能处理负权边，是因为它不依赖「dist 最小的顶点已经最终确定」这个贪心前提，而是最多做 n-1 轮全局修正。Dijkstra 一旦把顶点并入 S 就不再改动，遇到负权会出错；Bellman-Ford 允许反复改，代价是时间从 O(n²) 退化到 O(n·e)。',
    },
    {
      heading: '复杂度与判环',
      body: '最多 n-1 轮、每轮 e 条边，时间 O(n·e)，空间只需 dist 与 pred 两个数组，O(n)。若某一整轮没有更新，本演示会立即结束松弛循环，与代码一致。随后额外遍历所有边进行检测；只有源点可达的边仍能松弛，才判定存在可达负权回路。这次检测不计入松弛轮数。',
      points: ['队列优化的版本叫 SPFA，平均更快但最坏仍是 O(n·e)', 'pred 数组记录前驱，可还原整条路径', '负权回路存在时，绕圈可以无限减小距离'],
    },
  ],
  quiz: [
    { q: 'Bellman-Ford 最多需要几轮松弛？', options: ['1 轮', 'n-1 轮', 'n 轮', 'e 轮'], answer: 1, explain: '无可达负权回路时，最短路径可以取为至多 n-1 条边的简单路径；最多 n-1 轮即可求解，也可能提前收敛。' },
    { q: '额外检测时，源点可达的边仍可松弛，说明？', options: ['算法写错了', '存在源点可达的负权回路', '图不连通', '起点选错了'], answer: 1, explain: '完成最多 n-1 轮松弛或提前收敛后，若源点可达的边仍能松弛，说明存在可达负权回路。' },
    { q: '与 Dijkstra 相比，Bellman-Ford 的主要代价是？', options: ['不能求单源最短路', '时间从 O(n²) 退化到 O(n·e)', '需要 O(n²) 空间', '必须要求图连通'], answer: 1, explain: '放弃贪心、允许反复修正，换来对负权边的支持，时间是 O(n·e)。' },
  ],
  generate: (input) => {
    const custom = decodeCustomGraph(input);
    const n = custom?.labels.length ?? Math.min(Math.max(input[0] || 5, 3), 5);
    const vertices = custom?.labels ?? VEX.slice(0, n);
    const source = custom?.source ?? 0;
    const ids = vertices.map((v) => `v${v}`);
    const dedges = custom?.edges ?? DEDGES.filter(([a, b]) => a < n && b < n);
    const m = dedges.length;
    const steps: TraceStep[] = [];
    let k = 0;
    const dist: number[] = Array(n).fill(INF);
    const pred: number[] = Array(n).fill(-1);
    let curEdge = -1;
    let round = 0;
    let changed = 0;
    let total = 0;
    let relaxText = '—';
    let cycleStatus = '未检测';

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes = vertices.map((v, i) =>
        nodeAt(ids[i], v, custom ? undefined : POS[i].x, custom ? undefined : POS[i].y, i === source ? 'found' : dist[i] === INF ? 'default' : 'visited'),
      );
      const edges = dedges.map(([a, b, w], idx) => {
        let st: EdgeState = 'default';
        if (idx === curEdge) st = 'active';
        else if (pred[b] === a) st = 'tree';
        return edge(ids[a], ids[b], String(w), st, true);
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          graphScene(
            nodes,
            edges,
            `第 ${round || 0} 轮　本轮已更新 ${changed} 条　累计 ${total} 次`,
          ),
          {
            轮次: round || '—',
            当前边: curEdge >= 0 ? `${vertices[dedges[curEdge][0]]}→${vertices[dedges[curEdge][1]]}` : '—',
            dist变化: relaxText,
            dist: vertices.map((v, i) => `${v}:${show(dist[i])}`).join(' '),
            累计更新: total,
            本轮更新: changed,
            负权回路: cycleStatus,
          },
          caption,
        ),
      );
    };

    dist[source] = 0;
    push('init', '初始化', `dist[${vertices[source]}] = 0，其余为 ∞；前驱数组置空，准备开始逐轮松弛所有边。`);

    for (let r = 1; r <= n - 1; r++) {
      round = r;
      changed = 0;
      curEdge = -1;
      relaxText = '—';
      push('round', `第 ${r} 轮开始`, `第 ${r} 轮：按固定顺序把 ${m} 条边各松弛一次，最多进行 ${n - 1} 轮；若本轮无更新则提前结束。`);

      for (let e = 0; e < m; e++) {
        const [a, b, w] = dedges[e];
        curEdge = e;
        const cand = dist[a] + w;
        if (dist[a] !== INF && cand < dist[b]) {
          const old = dist[b];
          dist[b] = cand;
          pred[b] = a;
          changed += 1;
          total += 1;
          relaxText = `${show(old)} → ${show(cand)}`;
          push(
            'relax',
            '松弛成功',
            `先到 ${vertices[a]}（dist = ${show(dist[a])}）再走 ${vertices[a]}→${vertices[b]} 权 ${w}，得 ${cand}，小于原来的 ${show(old)}，更新 dist[${vertices[b]}]。`,
          );
        } else {
          relaxText = `保持 ${show(dist[b])}`;
          push(
            'relax',
            '松弛失败',
            `经 ${vertices[a]} 到 ${vertices[b]} 需要 ${show(cand)}，不优于现有的 ${show(dist[b])}，dist[${vertices[b]}] 保持不动。`,
          );
        }
      }

      curEdge = -1;
      relaxText = '—';
      if (changed === 0) {
        push('quiet', '本轮无更新', `第 ${r} 轮没有任何边被更新，距离已收敛，立即结束松弛循环；接下来执行额外的负权回路检测。`);
        break;
      }
    }

    curEdge = -1;
    relaxText = '无';
    cycleStatus = '检测中';
    push(
      'check',
      '负权回路检测',
      `已执行 ${round} 轮松弛，现在额外遍历所有边：检查是否仍有源点可达的边可以松弛；这次检测不计入松弛轮数。`,
    );

    const cycleEdge = dedges.findIndex(([a, b, w]) => dist[a] !== INF && dist[a] + w < dist[b]);
    if (cycleEdge >= 0) {
      curEdge = cycleEdge;
      const [from, to] = dedges[cycleEdge];
      cycleStatus = '检测到可达负权回路';
      push('negative', '检测到负权回路', `边 ${vertices[from]}→${vertices[to]} 从起点可达且仍可松弛，检测到可达负权回路，不能给出有效的完整最短距离结果。`);
      return steps;
    }
    cycleStatus = '未检测到可达负权回路';

    const finalDist = vertices
      .map((v, i) => `${v}=${show(dist[i])}`)
      .join('，');
    push('done', '完成', `共执行 ${round} 轮松弛；额外检测未发现源点可达的负权回路，各顶点最短距离为 ${finalDist}。`);
    return steps;
  },
};
