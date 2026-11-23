import type { AlgorithmMeta, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [5, 29, 7, 8, 14, 23, 3, 11];

export const huffmanTree: AlgorithmMeta = {
  slug: 'tree/huffman',
  title: '哈夫曼树 · 构造与编码',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '反复合并权值最小的两棵树，直到只剩一棵。',
  complexity: { time: 'O(n log n)', space: 'O(n)', extra: '每次合并产生一个度为 2 的新结点' },
  difficulty: '进阶',
  inputHint: '输入 2–8 个正整数作为各字符的权值，逐轮观察森林合并成一棵哈夫曼树。',
  defaultInput: DEFAULT,
  input: { min: 1, max: 999, minLen: 2, maxLen: 8 },
  code: {
    cpp: [
      { text: 'void Huffman(int w[], int n) {' },
      { text: '  // 森林中每棵树都只有一个叶子结点', anchor: 'init' },
      { text: '  for (int i = 0; i < n; i++) HT[i] = {w[i], -1, -1, -1};' },
      { text: '  for (int i = 1; i < n; i++) {' },
      { text: '    SelectTwo(HT, n + i - 1, p1, p2);  // 按权值、创建下标升序选两棵根树', anchor: 'pick' },
      { text: '    HT[n + i - 1] = {HT[p1].w + HT[p2].w, p1, p2, -1};', anchor: 'merge' },
      { text: '    HT[p1].parent = HT[p2].parent = n + i - 1;' },
      { text: '  }' },
      { text: '}  // 共需 n-1 次合并', anchor: 'done' },
    ],
    python: [
      { text: 'def huffman(w):' },
      { text: '    # 森林中每棵树都只有一个叶子结点', anchor: 'init' },
      { text: '    forest = [{"w": x, "l": None, "r": None} for x in w]' },
      { text: '    while len(forest) > 1:' },
      { text: '        forest.sort(key=lambda t: t["w"])', anchor: 'pick' },
      { text: '        a, b = forest.pop(0), forest.pop(0)' },
      { text: '        forest.append({"w": a["w"] + b["w"], "l": a, "r": b})', anchor: 'merge' },
      { text: '    return forest[0]  # 只剩一棵树', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把每个字符看成一棵只有一个结点的树，权值是它出现的次数。每轮从森林里挑出权值最小的两棵树，合并成一棵新树：新结点的权值是两者之和，左右孩子就是这两棵树。重复 n-1 次后森林只剩一棵树，即为哈夫曼树。',
      points: [
        '权值小的先合并，因此它们离根最远、编码最长，这正是压缩的关键',
        '每次合并使森林规模减 1，n 个叶子恰好需要 n-1 次合并',
        '哈夫曼树不存在度为 1 的结点，是严格二叉树',
      ],
    },
    {
      heading: '从哈夫曼树到编码',
      body: '约定走向左孩子的边为 0、右孩子为 1，从根到叶子的路径就是一串编码。由于每个字符都是叶子，任何编码都不会是另一个编码的前缀（前缀编码），解码时不需要分隔符，可以唯一还原。以示例权值 [5,29,7,8,14,23,3,11] 为例，按本演示的合并顺序得到的编码为：3→0000、5→0001、11→001、23→01、29→10、14→110、7→1110、8→1111。',
    },
    {
      heading: '带权路径长度',
      body: 'WPL 等于每个叶子权值乘它的深度之和，示例中 WPL = 3×4+5×4+7×4+8×4+11×3+14×3+23×2+29×2 = 271，平均码长 2.71 位。哈夫曼树的 WPL 在所有前缀编码方案中最小，因此又叫最优二叉树。',
      points: ['权值大的叶子离根近，编码短', '合并时权值相等，树的形态可能不同，但 WPL 相同', '构造过程依赖「每次选最小」，用堆可把时间降到 O(n log n)'],
    },
  ],
  quiz: [
    { q: '哈夫曼树每轮合并的是哪两棵树？', options: ['权值最大的两棵', '权值最小的两棵', '深度最大的两棵', '任意两棵'], answer: 1, explain: '每次取权值最小的两棵，才能让权值小的结点离根更远，使 WPL 最小。' },
    { q: 'n 个叶子的哈夫曼树共有多少个结点？', options: ['n', 'n-1', '2n-1', '2n'], answer: 2, explain: '严格二叉树中没有度为 1 的结点，n 个叶子加 n-1 个内部结点，共 2n-1 个。' },
    { q: '哈夫曼编码为什么不需要分隔符？', options: ['编码长度固定', '任一编码都不是另一编码的前缀', '编码只含 0 和 1', '所有字符权值相等'], answer: 1, explain: '字符都在叶子上，从根到叶的路径不可能互为前缀，所以可以唯一解码。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v) && v > 0);
    const vals = (raw.length >= 2 ? raw : DEFAULT).slice(0, 8).map((v) => Math.max(1, Math.round(v)));
    const steps: TraceStep[] = [];
    let k = 0;
    const weight: Record<string, number> = {};
    const name: Record<string, string> = {};
    const label: Record<string, string> = {};
    const parent: Record<string, string> = {};
    const kids: Record<string, string[]> = {};
    const order: string[] = [];
    const states: Record<string, NodeState> = {};
    let activeEdges = new Set<string>();
    let next = 0;
    let selText = '—';
    let lastSum: number | string = '—';

    vals.forEach((w, i) => {
      const id = `h${next++}`;
      weight[id] = w;
      name[id] = String.fromCharCode(65 + i);
      label[id] = name[id];
      order.push(id);
    });
    let roots = order.slice();

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes = [node('forest', '森林', 'default')];
      for (const id of order) nodes.push(node(id, weight[id], states[id] ?? 'default', label[id]));
      const edges: SceneEdge[] = [];
      for (const id of order) {
        const p = parent[id];
        if (p) {
          const key = `${p}>${id}`;
          edges.push(edge(p, id, undefined, activeEdges.has(key) ? 'active' : 'tree'));
        }
      }
      for (const r of roots) edges.push(edge('forest', r, undefined, 'default'));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          treeScene(nodes, edges, `森林中还有 ${roots.length} 棵树`),
          {
            森林规模: roots.length,
            本轮选中: selText,
            新结点权值: lastSum,
            根权值: roots.length === 1 ? weight[roots[0]] : '—',
          },
          caption,
        ),
      );
    };

    push(
      'init',
      '初始化森林',
      `把 ${vals.length} 个权值各建成一棵单结点树，森林规模为 ${vals.length}，权值分别是 ${vals.join('、')}。`,
    );

    while (roots.length > 1) {
      // 根按创建顺序追加，稳定排序与 Python 的同权处理一致。
      const sorted = [...roots].sort((x, y) => weight[x] - weight[y]);
      const a = sorted[0];
      const b = sorted[1];
      states[a] = 'active';
      states[b] = 'active';
      selText = `${name[a]}(${weight[a]}) + ${name[b]}(${weight[b]})`;
      lastSum = weight[a] + weight[b];
      push(
        'pick',
        '选出两棵最小的树',
        `森林中有 ${roots.length} 棵树，权值最小的是 ${name[a]}(${weight[a]}) 与 ${name[b]}(${weight[b]})，把它们取出准备合并。`,
      );

      const nid = `h${next++}`;
      weight[nid] = weight[a] + weight[b];
      name[nid] = nid;
      label[nid] = '';
      parent[a] = nid;
      parent[b] = nid;
      kids[nid] = [a, b];
      order.push(nid);
      roots = roots.filter((r) => r !== a && r !== b);
      roots.push(nid);
      states[nid] = 'insert';
      states[a] = 'default';
      states[b] = 'default';
      activeEdges = new Set([`${nid}>${a}`, `${nid}>${b}`]);
      push(
        'merge',
        '合并成一棵新树',
        `${weight[a]} + ${weight[b]} = ${weight[nid]}，新建结点 ${nid} 作为 ${name[a]} 与 ${name[b]} 的父结点，森林规模减为 ${roots.length}。`,
      );
      activeEdges = new Set();
    }

    const rootId = roots[0];
    let wpl = 0;
    const walk = (id: string, depth: number): void => {
      if (!kids[id]) {
        wpl += weight[id] * depth;
        return;
      }
      for (const c of kids[id]) walk(c, depth + 1);
    };
    walk(rootId, 0);
    states[rootId] = 'found';
    selText = '—';
    lastSum = '—';
    push(
      'done',
      '完成',
      `森林合并成一棵树，根权值 ${weight[rootId]} 等于全部叶子权值之和，带权路径长度 WPL = ${wpl}。`,
    );
    return steps;
  },
};
