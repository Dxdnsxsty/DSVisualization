import type { AlgorithmMeta, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

/** 固定示例图（无向，明显分三层）：A-B、A-C、B-D、B-E、C-E、C-F、E-F */
const VEX = ['A', 'B', 'C', 'D', 'E', 'F'];
const POS: { x: number; y: number }[] = [
  { x: 0.5, y: 0.05 },
  { x: 0.14, y: 0.34 },
  { x: 0.86, y: 0.34 },
  { x: 0.08, y: 0.94 },
  { x: 0.5, y: 0.74 },
  { x: 0.92, y: 0.94 },
];
const ADJ: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [4, 5],
];

/** 无向边的状态用「小下标-大下标」做键，避免正反两个方向各存一份。 */
const eKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

export const bfsGraph: AlgorithmMeta = {
  slug: 'graph/bfs',
  title: '图 · 广度优先遍历',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '借助队列逐层扩散，先访问离起点近的顶点。',
  complexity: { time: 'O(n+e)', space: 'O(n)', extra: '邻接矩阵为 O(n²)' },
  difficulty: '入门',
  inputHint: '输入顶点个数（3–6），按示例无向图演示从 A 出发的广度优先遍历。',
  defaultInput: [6],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'void BFS(AMGraph G, int v) {' },
      { text: '  int Q[100], front = 0, rear = 0;', anchor: 'init' },
      { text: '  visited[v] = 1; Q[rear++] = v;' },
      { text: '  while (front < rear) {', anchor: 'loop' },
      { text: '    int u = Q[front++];', anchor: 'dequeue' },
      { text: '    printf("%c ", G.vex[u]);', anchor: 'visit' },
      { text: '    for (int w = 0; w < G.vexnum; w++) {' },
      { text: '      if (!G.arcs[u][w]) continue;', anchor: 'check' },
      { text: '      if (visited[w]) continue;' },
      { text: '      visited[w] = 1; Q[rear++] = w;', anchor: 'enqueue' },
      { text: '    }' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def bfs(g, v):' },
      { text: '    q = [v]  # 队列', anchor: 'init' },
      { text: '    visited[v] = True' },
      { text: '    while q:', anchor: 'loop' },
      { text: '        u = q.pop(0)', anchor: 'dequeue' },
      { text: '        print(g.vex[u])', anchor: 'visit' },
      { text: '        for w in range(g.n):' },
      { text: '            if not g.arcs[u][w]:', anchor: 'check' },
      { text: '                continue' },
      { text: '            if visited[w]:' },
      { text: '                continue' },
      { text: '            visited[w] = True', anchor: 'enqueue' },
      { text: '            q.append(w)' },
      { text: '    # 队列空，遍历结束', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '从起点 v 出发，先访问 v 的全部邻接点，再依次访问这些邻接点的邻接点，像水波一样一圈一圈向外扩散。队列的先进先出保证了「先被发现的顶点先被扩展」，所以出队次序就是按离起点的边数由近及远。',
      points: [
        '入队前就把 visited 置 1，否则同一个顶点会被不同前驱重复入队',
        '队列中存放的是「已发现但还没扩展」的顶点',
        '非连通图需要在外面再套一层循环，对每个未访问顶点各发起一次 BFS',
      ],
    },
    {
      heading: '与深度优先的对比',
      body: 'BFS 用队列、按层推进，DFS 用栈（递归）、一条路走到底。在无权图上，BFS 首次到达某顶点时的层数就是它的最短路径长度，这是 BFS 最重要的应用；DFS 则更适合判环与求连通分量。',
    },
    {
      heading: '复杂度',
      body: '每个顶点入队出队各一次，每条边被检查两次（无向图），因此邻接表实现为 O(n+e)；邻接矩阵实现要扫描整行，退化为 O(n²)。空间上队列最多存 n 个顶点。',
      points: ['O(n+e) 只在邻接表下成立', 'visited 数组必不可少', '入队标记时机决定是否会重复访问'],
    },
  ],
  quiz: [
    { q: '广度优先遍历通常借助什么结构实现？', options: ['栈', '队列', '二叉堆', '并查集'], answer: 1, explain: '队列先进先出，保证先发现的顶点先被扩展，从而按层遍历。' },
    { q: 'visited[w] 应该在哪一步置 1？', options: ['出队时', '入队时', '访问完邻接点后', '回溯时'], answer: 1, explain: '入队即标记，否则同一顶点可能被多个前驱重复入队。' },
    { q: '对示例图从 A 出发，第三层（距离为 2）的顶点有几个？', options: ['1 个', '2 个', '3 个', '4 个'], answer: 2, explain: '第一层 A，第二层 B、C，第三层 D、E、F 共 3 个。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || 6, 3), 6);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const pairs = ADJ.filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const visited: boolean[] = Array(n).fill(false);
    const parents: (number | undefined)[] = Array(n);
    const skipped = new Set<string>();
    const queue: number[] = [];
    const order: number[] = [];
    const dist: number[] = Array(n).fill(-1);

    const push = (anchor: string, phase: string, caption: string, cur = -1) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(ids[i], v, POS[i].x, POS[i].y, visited[i] ? 'visited' : 'default', undefined, i === cur ? '当前' : undefined),
      );
      const edges = pairs.map(([a, b]) => {
        if (parents[b] === a) return edge(ids[a], ids[b], undefined, 'tree', true);
        if (parents[a] === b) return edge(ids[b], ids[a], undefined, 'tree', true);
        return edge(ids[a], ids[b], undefined, skipped.has(eKey(a, b)) ? 'reject' : 'default');
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          { ...graphScene(nodes, edges, `从 A 出发，已标记 ${visited.filter(Boolean).length} 个顶点`), graphTrace: 'traversal' },
          {
            队列: queue.map((v) => VEX[v]).join(' ') || '空',
            当前顶点: cur >= 0 ? VEX[cur] : '—',
            当前层: cur >= 0 && dist[cur] >= 0 ? dist[cur] : '—',
            遍历序列: order.map((v) => VEX[v]).join('') || '空',
          },
          caption,
        ),
      );
    };

    visited[0] = true;
    dist[0] = 0;
    queue.push(0);
    push('init', '初始化', '起点 A 入队并标记已访问，队列中的顶点都是「已发现待扩展」。');

    while (queue.length > 0) {
      const u = queue.shift() as number;
      push('dequeue', '出队', `队头 ${VEX[u]} 出队，接下来扩展它的所有邻接点。`, u);
      order.push(u);
      push('visit', '访问顶点', `访问 ${VEX[u]}，它是第 ${dist[u] + 1} 层（距起点 ${dist[u]} 条边）的顶点。`, u);

      for (let w = 0; w < n; w++) {
        if (!pairs.some(([a, b]) => (a === u && b === w) || (a === w && b === u))) continue;
        if (visited[w]) {
          skipped.add(eKey(u, w));
          push('check', '跳过已访问', `邻接点 ${VEX[w]} 已访问过，跳过，继续看下一个邻接点。`, u);
          continue;
        }
        visited[w] = true;
        dist[w] = dist[u] + 1;
        queue.push(w);
        parents[w] = u;
        push('enqueue', '发现并入队', `${VEX[w]} 未被访问，标记 visited 后入队，距离为 ${dist[w]}。`, u);
      }
    }
    push('done', '遍历完成', `队列已空，广度优先序列为 ${order.map((v) => VEX[v]).join(' → ')}。`);
    return steps;
  },
};
