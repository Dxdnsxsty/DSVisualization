import type { AlgorithmMeta, EdgeState, NodeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, node, nodeAt } from '../../engine/scene';
import { customGraphInput, decodeCustomGraph } from '../../engine/structure-input';

/** 固定有向无环图：A→B、A→C、B→D、C→D、C→E、D→F、E→F */
const VEX = ['A', 'B', 'C', 'D', 'E', 'F'];
const POS: { x: number; y: number }[] = [
  { x: 0.06, y: 0.5 },
  { x: 0.32, y: 0.1 },
  { x: 0.32, y: 0.9 },
  { x: 0.62, y: 0.5 },
  { x: 0.62, y: 0.9 },
  { x: 0.94, y: 0.5 },
];
const ADJ: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5],
];

export const topoSort: AlgorithmMeta = {
  slug: 'graph/topo-sort',
  title: '图 · 拓扑排序',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '反复取出入度为 0 的顶点，并删掉它的出边。',
  complexity: { time: 'O(n+e)', space: 'O(n)', extra: '邻接矩阵实现为 O(n²)' },
  difficulty: '进阶',
  inputHint: '输入顶点个数（3–6），选择无环或有环案例，观察入度、栈和输出序列。',
  defaultInput: [6],
  input: customGraphInput('directed'),
  customGraph: 'directed',
  graphCases: [
    { id: 0, label: '无环图', description: '所有顶点都能输出，得到合法拓扑序列。' },
    { id: 1, label: '存在环', description: 'B、C 形成环，栈提前清空；无法得到完整拓扑序列。' },
  ],
  code: {
    cpp: [
      { text: 'void TopSort(AMGraph G) {' },
      { text: '  int indegree[MAXV], st[MAXV], top = -1, count = 0;', anchor: 'init' },
      { text: '  for (int i = 0; i < G.vexnum; i++) {' },
      { text: '    indegree[i] = 0;' },
      { text: '    for (int j = 0; j < G.vexnum; j++)' },
      { text: '      indegree[i] += G.arcs[j][i];' },
      { text: '    if (indegree[i] == 0) st[++top] = i;' },
      { text: '  }' },
      { text: '  while (top >= 0) {', anchor: 'pop' },
      { text: '    int v = st[top--];' },
      { text: '    printf("%c ", G.vex[v]);' },
      { text: '    count++;' },
      { text: '    for (int w = 0; w < G.vexnum; w++)', anchor: 'dec' },
      { text: '      if (G.arcs[v][w]) {' },
      { text: '        indegree[w]--;' },
      { text: '        if (indegree[w] == 0) st[++top] = w;' },
      { text: '      }' },
      { text: '  }' },
      { text: '  if (count < G.vexnum) printf("存在环，无法完成拓扑排序");', anchor: 'cycle' },
      { text: '  // 否则已输出全部顶点', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def topo_sort(g):' },
      { text: '    indeg = [0] * g.n', anchor: 'init' },
      { text: '    for u in range(g.n):' },
      { text: '        for v in range(g.n):' },
      { text: '            indeg[v] += g.arcs[u][v]' },
      { text: '    st = [u for u in range(g.n) if indeg[u] == 0]' },
      { text: '    order = []' },
      { text: '    while st:', anchor: 'pop' },
      { text: '        v = st.pop()' },
      { text: '        order.append(v)' },
      { text: '        for w in range(g.n):', anchor: 'dec' },
      { text: '            if g.arcs[v][w]:' },
      { text: '                indeg[w] -= 1' },
      { text: '                if indeg[w] == 0:' },
      { text: '                    st.append(w)' },
      { text: '    if len(order) < g.n: raise ValueError("存在环，无法完成拓扑排序")', anchor: 'cycle' },
      { text: '    return order', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '拓扑排序把有向图的顶点排成一个线性序列，使每条边都从前指向后。做法是反复「摘掉」入度为 0 的顶点：它没有前置约束，可以直接输出；输出后把它的出边删掉，对应终点的入度减一，减到 0 就可以进入待输出集合。',
      points: [
        '用栈或队列保存入度为 0 的顶点，二者都能得到合法序列，只是次序不同',
        '入度必须在删边后实时更新，不能只看初始值',
        '若输出顶点数少于 n，说明图中存在回路，拓扑排序不存在',
      ],
    },
    {
      heading: '典型应用',
      body: '课程先修关系、工程任务的先后次序、编译单元的依赖关系都可以建模成 AOV 网，用拓扑排序给出一个可行的执行顺序。若要求「同等条件下编号小的先做」，把栈换成小根堆即可。',
    },
    {
      heading: '复杂度',
      body: '每个顶点进出栈各一次，每条边被处理一次，邻接表实现为 O(n+e)；邻接矩阵要扫描每个顶点的整行，退化为 O(n²)。空间上需要入度数组与栈，共 O(n)。',
      points: ['拓扑序列一般不唯一', '删边只是逻辑上的入度减一，不必真的改矩阵', '判环也可以直接用拓扑排序的输出个数'],
    },
  ],
  quiz: [
    { q: '拓扑排序每一轮输出的是哪类顶点？', options: ['出度为 0 的顶点', '入度为 0 的顶点', '度数最大的顶点', '任意顶点'], answer: 1, explain: '入度为 0 说明没有未完成的前置约束，可以立即输出。' },
    { q: '若拓扑排序输出的顶点数小于 n，说明什么？', options: ['图不连通', '图中有回路', '图是二叉树', '存在孤立点'], answer: 1, explain: '回路上的顶点入度永远减不到 0，无法被输出。' },
    { q: '对示例图执行本算法，第一个输出的顶点是？', options: ['A', 'B', 'D', 'F'], answer: 0, explain: '初始只有 A 的入度为 0，因此第一个输出 A。' },
  ],
  generate: (input) => {
    const custom = decodeCustomGraph(input);
    const n = custom?.labels.length ?? Math.min(Math.max(input[0] || 6, 3), 6);
    const vertices = custom?.labels ?? VEX.slice(0, n);
    const ids = vertices.map((v) => `v${v}`);
    const pairs = custom?.edges ?? (input[1] === 1 ? [...ADJ, [1, 2], [2, 1]] : ADJ)
      .filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const indeg: number[] = Array(n).fill(0);
    for (const [, b] of pairs) indeg[b] += 1;
    const stack: number[] = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) stack.push(i);
    const order: number[] = [];
    const states: Record<string, NodeState> = {};
    const eStates: Record<string, EdgeState> = {};
    for (const v of stack) states[ids[v]] = 'active';

    const push = (anchor: string, phase: string, caption: string, cur: string) => {
      const nodes = vertices.map((v, i) =>
        nodeAt(ids[i], v, custom ? undefined : POS[i].x, custom ? undefined : POS[i].y, states[ids[i]] ?? 'default', `入度 ${indeg[i]}`),
      );
      const edges = pairs.map(([a, b]) =>
        edge(ids[a], ids[b], undefined, eStates[`${a}>${b}`] ?? 'default', true),
      );
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...graphScene(nodes, edges, `已输出 ${order.length} / ${n} 个顶点`),
            graphTrace: 'topology',
            output: { label: '拓扑输出序列', values: order.map((v) => vertices[v]) },
            aux: {
              label: '入度为 0 的待输出顶点栈',
              layout: 'stack',
              capacity: n,
              nodes: stack.map((v, index) => node(ids[v], vertices[v],
                index === stack.length - 1
                  ? anchor === 'init' || (anchor === 'dec' && cur === vertices[v]) ? 'insert' : 'active'
                  : 'default')),
              pointers: [{ label: 'top', index: stack.length > 0 ? stack.length - 1 : null }],
            },
          },
          {
            入度: vertices.map((v, i) => `${v}${indeg[i]}`).join(' '),
            栈: stack.map((v) => vertices[v]).join(' ') || '空',
            栈顶: stack.length > 0 ? vertices[stack[stack.length - 1]] : '空',
            输出序列: order.map((v) => vertices[v]).join(' ') || '空',
            当前顶点: cur,
          },
          caption,
        ),
      );
    };

    push('init', '统计入度', stack.length
      ? `统计各顶点入度，入度为 0 的 ${stack.map((v) => vertices[v]).join('、')} 入栈。`
      : '统计各顶点入度，没有入度为 0 的顶点，栈保持为空。', '—');

    while (stack.length > 0) {
      const v = stack.pop() as number;
      states[ids[v]] = 'sorted';
      order.push(v);
      push('pop', '出栈输出', `${vertices[v]} 入度为 0，出栈并输出，它是第 ${order.length} 个顶点。`, vertices[v]);

      for (const [a, b] of pairs) {
        if (a !== v) continue;
        eStates[`${a}>${b}`] = 'removed';
        indeg[b] -= 1;
        if (indeg[b] === 0) {
          stack.push(b);
          states[ids[b]] = 'active';
        }
        push(
          'dec',
          '删边',
          `${vertices[v]}→${vertices[b]} 的约束已满足，${vertices[b]} 入度减为 ${indeg[b]}${indeg[b] === 0 ? '，入栈等待输出' : '，仍有前置顶点未输出'}。`,
          vertices[b],
        );
      }
    }
    if (order.length < n) {
      push('cycle', '检测到环', `栈已空，但仅输出 ${order.length} / ${n} 个顶点；剩余依赖无法消除，图中存在环，无法完成拓扑排序。当前序列只是部分输出。`, '—');
    } else {
      push('done', '完成', `拓扑序列为 ${order.map((v) => vertices[v]).join(' → ')}；输出数等于 n，图中无回路。`, '—');
    }
    return steps;
  },
};
