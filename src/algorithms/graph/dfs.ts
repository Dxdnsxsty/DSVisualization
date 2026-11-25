import type { AlgorithmMeta, EdgeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';
import { customGraphInput, decodeCustomGraph } from '../../engine/structure-input';

/** 固定示例图（无向）：A-B、A-C、B-D、B-E、C-F、E-F */
const PRESET_VERTICES = ['A', 'B', 'C', 'D', 'E', 'F'];
const POS: { x: number; y: number }[] = [
  { x: 0.5, y: 0.04 },
  { x: 0.16, y: 0.34 },
  { x: 0.84, y: 0.34 },
  { x: 0.08, y: 0.72 },
  { x: 0.46, y: 0.72 },
  { x: 0.86, y: 0.95 },
];
const ADJ: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [4, 5],
];

export const dfsGraph: AlgorithmMeta = {
  slug: 'graph/dfs',
  title: '图 · 深度优先遍历',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '沿一条路走到底，走不通再回溯。',
  complexity: { time: 'O(n+e)', space: 'O(n)', extra: '邻接矩阵为 O(n²)' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–6），按示例无向图演示从 A 出发的深度优先遍历。',
  defaultInput: [6],
  input: customGraphInput('undirected'),
  customGraph: 'undirected',
  graphCases: [
    { id: 0, label: '连通图', description: '从 A 出发可以访问全部顶点。' },
    { id: 1, label: '非连通图', description: '从 A 只能访问所在连通分量，观察哪些顶点仍未访问。' },
  ],
  code: {
    cpp: [
      { text: 'void DFS(AMGraph G, int v) {' },
      { text: '  printf("%c ", G.vex[v]);', anchor: 'visit' },
      { text: '  visited[v] = 1;', anchor: 'mark' },
      { text: '  for (int w = 0; w < G.vexnum; w++)', anchor: 'loop' },
      { text: '    if (G.arcs[v][w] && !visited[w])', anchor: 'check' },
      { text: '      DFS(G, w);', anchor: 'recurse' },
      { text: '}', anchor: 'ret' },
      { text: '// 从 A 出发的遍历结束；其他连通分量需另行发起 DFS', anchor: 'done' },
    ],
    python: [
      { text: 'def dfs(g, v, visited):' },
      { text: '    print(g.vex[v])', anchor: 'visit' },
      { text: '    visited[v] = True', anchor: 'mark' },
      { text: '    for w in range(g.n):', anchor: 'loop' },
      { text: '        if g.arcs[v][w] and not visited[w]:', anchor: 'check' },
      { text: '            dfs(g, w, visited)', anchor: 'recurse' },
      { text: '    # 本次调用返回', anchor: 'ret' },
      { text: '# 从 A 出发的遍历结束；其他连通分量需另行发起 DFS', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '深度优先遍历类似走迷宫：选定一个未访问的邻接点就一直走下去，直到无路可走再回溯到上一个分叉点。实现上依赖一个 visited 数组记录访问状态，以及递归栈保存来路。',
      points: [
        '邻接矩阵需要扫描整行 n 个位置，复杂度 O(n²)；邻接表只扫实际边，O(n+e)',
        '遍历序列不唯一：取决于邻接点的访问次序',
        '非连通图需要在外层再套一层循环，对每个未访问顶点各发起一次 DFS',
      ],
    },
    {
      heading: '与广度优先的对比',
      body: 'DFS 用栈（递归），一条路走到底，适合判环、求连通分量、拓扑排序；BFS 用队列，逐层扩散，适合求最短路径（无权图）。两者都需要 visited 数组，标记时机不同会得到不同结果。',
    },
  ],
  quiz: [
    { q: '深度优先遍历通常借助什么实现？', options: ['队列', '栈（或递归）', '优先队列', '哈希表'], answer: 1, explain: 'DFS 的"后进先出"特性与栈一致，递归调用本身就是栈。' },
    { q: 'visited[v] 应该在什么时候置为 1？', options: ['访问完所有邻接点之后', '一进入该顶点就置 1', '回溯时置 1', '不需要标记'], answer: 1, explain: '进入即标记，否则遇到环会重复访问导致死循环。' },
    { q: '对示例图从 A 出发，第二个被访问的顶点是？', options: ['B', 'C', 'D', 'F'], answer: 0, explain: '按邻接点从小到大的次序，A 先走到 B，再深入 B 的邻接点 D。' },
  ],
  generate: (input) => {
    const custom = decodeCustomGraph(input);
    const n = custom?.labels.length ?? Math.min(Math.max(input[0] || 6, 3), 6);
    const source = custom?.source ?? 0;
    const vertices = custom?.labels ?? PRESET_VERTICES.slice(0, n);
    const ids = vertices.map((v) => `v${v}`);
    const pairs = custom?.edges ?? (input[1] === 1 ? [[0, 1], [2, 3], [3, 4], [4, 5]] : ADJ)
      .filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const visited: boolean[] = Array(n).fill(false);
    const parents: (number | undefined)[] = Array(n);
    let checking: { from: number; to: number; state: EdgeState } | undefined;

    const push = (anchor: string, phase: string, caption: string, stack: number[]) => {
      const current = stack.at(-1);
      const callStack = stack.map((v) => `DFS(${vertices[v]})`);
      const nodes = vertices.map((v, i) =>
        nodeAt(ids[i], v, custom ? undefined : POS[i].x, custom ? undefined : POS[i].y, visited[i] ? 'visited' : i === current ? 'active' : 'default', undefined, i === current ? '当前' : undefined),
      );
      const edges = pairs.map(([a, b]) => {
        if (parents[b] === a) return edge(ids[a], ids[b], undefined, 'tree', true);
        if (parents[a] === b) return edge(ids[b], ids[a], undefined, 'tree', true);
        if (checking && ((checking.from === a && checking.to === b) || (checking.from === b && checking.to === a))) {
          return edge(ids[a], ids[b], undefined, checking.state);
        }
        return edge(ids[a], ids[b]);
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...graphScene(nodes, edges, `从 ${vertices[source]} 出发，已访问 ${visited.filter(Boolean).length} / ${n}`),
            graphTrace: 'traversal',
            aux: {
              label: 'DFS 递归调用栈',
              layout: 'call-stack',
              capacity: n,
              nodes: stack.map((v, index) => ({
                id: ids[v], value: `DFS(${vertices[v]})`,
                state: index === stack.length - 1 ? 'active' : 'default',
              })),
              pointers: [{ label: 'top', index: stack.length ? stack.length - 1 : null }],
            },
          },
          {
            当前顶点: callStack.at(-1) ?? '—',
            已访问: visited.map((b, i) => (b ? vertices[i] : '')).filter(Boolean).join('') || '空',
            递归深度: stack.length,
          },
          caption,
          callStack.length ? callStack : undefined,
        ),
      );
    };

    const dfs = (v: number, stack: number[]): void => {
      stack.push(v);
      push('visit', '访问顶点', `进入 ${vertices[v]}，把它加入遍历序列。`, stack);
      visited[v] = true;
      push('mark', '标记已访问', `visited[${vertices[v]}] = 1，之后不会再进入它。`, stack);

      for (let w = 0; w < n; w++) {
        const linked = pairs.some(([a, b]) => (a === v && b === w) || (a === w && b === v));
        if (!linked) continue;
        checking = { from: v, to: w, state: 'active' };
        push('loop', '考察邻接点', `检查 ${vertices[v]} 的邻接点 ${vertices[w]}。`, stack);
        if (visited[w]) {
          checking.state = 'reject';
          push('check', '跳过已访问', `${vertices[w]} 已访问过，跳过它，继续看下一个邻接点。`, stack);
          checking = undefined;
        } else {
          checking = undefined;
          parents[w] = v;
          push('recurse', '递归深入', `${vertices[w]} 未访问，从它继续深度优先，压栈进入。`, stack);
          dfs(w, stack);
        }
      }
      stack.pop();
      push('ret', '回溯', `${vertices[v]} 的所有邻接点都处理完，本次调用返回上一层。`, stack);
    };

    dfs(source, []);
    const remaining = vertices.filter((_, index) => !visited[index]);
    push('done', '遍历完成', remaining.length
      ? `从 ${vertices[source]} 出发的遍历结束；${remaining.join('、')} 不与 ${vertices[source]} 连通，仍未访问。遍历全图需要从未访问顶点再次发起 DFS。`
      : `从 ${vertices[source]} 出发的遍历结束，所有顶点均已访问，调用栈已空。`, []);
    return steps;
  },
};
