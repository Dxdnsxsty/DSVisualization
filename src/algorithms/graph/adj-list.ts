import type { AlgorithmMeta, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

const names = ['A', 'B', 'C', 'D', 'E', 'F'];
const pairs = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5]];

export const adjList: AlgorithmMeta = {
  slug: 'graph/adj-list',
  title: '图 · 邻接表构建',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '顶点表存首边指针，每条边结点挂到对应顶点的链表。',
  complexity: { time: 'O(V+E)', space: 'O(V+E)' },
  difficulty: '入门',
  inputHint: '输入顶点数（3–6），观察无向图如何逐条建立邻接表。',
  defaultInput: [6],
  input: { min: 3, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'void AddEdge(Graph& g, int a, int b) {', anchor: 'init' },
      { text: '  Edge* p = new Edge{b, g.head[a]};', anchor: 'alloc' },
      { text: '  g.head[a] = p;', anchor: 'link' },
      { text: '  Edge* q = new Edge{a, g.head[b]};', anchor: 'allocReverse' },
      { text: '  g.head[b] = q;', anchor: 'linkReverse' },
      { text: '}', anchor: 'done' },
    ],
    python: [
      { text: 'def add_edge(g, a, b):', anchor: 'init' },
      { text: '    p = Edge(b, g.head[a])', anchor: 'alloc' },
      { text: '    g.head[a] = p', anchor: 'link' },
      { text: '    q = Edge(a, g.head[b])', anchor: 'allocReverse' },
      { text: '    g.head[b] = q', anchor: 'linkReverse' },
      { text: '    return g', anchor: 'done' },
    ],
  },
  doc: [{ heading: '核心思想', body: '邻接表为每个顶点维护一条边链表。无向边 a-b 要分别加入 a 与 b 的链表，因此会生成两个边结点。图上每个箭头对应一条已挂接的记录。', points: ['稀疏图比邻接矩阵省空间', '枚举某顶点邻居只需扫描该顶点链表'] }],
  quiz: [{ q: '无向边 A-B 在邻接表中通常存几次？', options: ['2 次', '1 次', '0 次', '取决于权值'], answer: 0, explain: 'A 的邻接链表放 B，B 的邻接链表放 A。' }],
  generate: (input) => {
    const n = input[0];
    const connections = pairs.filter(([a, b]) => a < n && b < n);
    const adj = Array.from({ length: n }, () => [] as number[]);
    const steps: TraceStep[] = [];
    const id = (index: number) => `v${index}`;
    const push = (anchor: string, caption: string, hotEdge = -1, current = -1) => {
      const nodes = names.slice(0, n).map((name, i) => nodeAt(
        id(i), name, 0.1 + 0.8 * (i / (n - 1)), i % 2 ? 0.25 : 0.75,
        adj[i].length > 0 ? 'visited' : i === current ? 'active' : 'default', undefined, i === current ? '当前' : undefined,
      ));
      const edges = connections.map(([a, b], index) => {
        const forward = adj[a].includes(b);
        const reverse = adj[b].includes(a);
        if (forward) return { ...edge(id(a), id(b), undefined, 'tree', true), bidirectional: reverse };
        return edge(id(a), id(b), undefined, index === hotEdge ? 'active' : 'default');
      });
      const scene = { ...graphScene(nodes, edges), graphTrace: 'adjacency' as const };
      const adjacency = adj.map((neighbors, i) => `${names[i]}: ${neighbors.map((v) => names[v]).join(' → ') || '∅'}`).join('  ');
      steps.push(makeStep(steps.length, anchor, '建立邻接表', scene, { 邻接表: adjacency }, caption));
    };

    push('init', '创建顶点表，所有首边指针均为 NULL。');
    connections.forEach(([a, b], index) => {
      push('alloc', `为 ${names[a]} 的邻接表申请记录，准备指向 ${names[b]}。`, index, a);
      adj[a].unshift(b);
      push('link', `${names[b]} 挂到 ${names[a]} 的邻接表表头，画出 ${names[a]} → ${names[b]}。`, index, a);
      push('allocReverse', `为 ${names[b]} 的邻接表申请反向记录，准备指向 ${names[a]}。`, index, b);
      adj[b].unshift(a);
      push('linkReverse', `${names[a]} 挂到 ${names[b]} 的邻接表表头，这条无向边的两条记录都已接好。`, index, b);
    });
    push('done', '所有边结点已挂接，邻接表构建完成。');
    return steps;
  },
};
