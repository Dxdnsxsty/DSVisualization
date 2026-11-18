import type { AlgorithmMeta, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

/** 先序遍历：按层序数组建一棵完全二叉树，再递归遍历。 */
export const preorderTree: AlgorithmMeta = {
  slug: 'tree/preorder',
  title: '二叉树 · 先序遍历',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '根 → 左 → 右，观察递归进出栈的顺序。',
  complexity: { time: 'O(n)', space: 'O(h)', extra: 'h 为树高，递归栈深度' },
  difficulty: '入门',
  inputHint: '输入 3–15 个整数，按层序建完全二叉树（第 i 个结点的孩子是 2i+1、2i+2）。',
  defaultInput: [1, 2, 3, 4, 5, 6, 7],
  input: { min: -999, max: 999, minLen: 2, maxLen: 15 },
  code: {
    cpp: [
      { text: '// 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'void PreOrder(BTNode *b) {' },
      { text: '  if (b == NULL) return;', anchor: 'guard' },
      { text: '  printf("%d ", b->data);', anchor: 'visit' },
      { text: '  PreOrder(b->lchild);', anchor: 'left' },
      { text: '  PreOrder(b->rchild);', anchor: 'right' },
      { text: '}', anchor: 'ret' },
    ],
    python: [
      { text: '# 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'def preorder(b):' },
      { text: '    if b is None:', anchor: 'guard' },
      { text: '        return' },
      { text: '    print(b.data)', anchor: 'visit' },
      { text: '    preorder(b.lchild)', anchor: 'left' },
      { text: '    preorder(b.rchild)', anchor: 'right' },
      { text: '    # 返回上层调用', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '先序遍历的访问次序是「根 → 左子树 → 右子树」。递归写法只有三行：访问根、递归左、递归右。递归的本质是栈：进入一层压栈，返回一层弹栈，所以遍历顺序与递归栈的进出顺序完全对应。',
      points: [
        '先序的第一个结点一定是根，最后一个结点是最右下方的结点',
        '递归出口必须放在最前面，否则空指针会被当作结点访问',
        '递归深度等于树高 h，空间复杂度不是 O(1)',
      ],
    },
    {
      heading: '递归与栈的对应关系',
      body: '右子树递归调用返回后，函数直接结束，这一次调用出栈。观察舞台下方的调用栈面板，可以看到栈顶始终是"当前正在处理"的结点，这与舞台高亮保持一致。',
    },
  ],
  quiz: [
    { q: '先序遍历的访问顺序是？', options: ['根 → 左 → 右', '左 → 根 → 右', '左 → 右 → 根', '按层从左到右'], answer: 0, explain: '先序（PreOrder）先访问根结点，再依次递归左右子树。' },
    { q: '对下图完全二叉树先序遍历，第三个被访问的结点是？', options: ['3', '4', '2', '6'], answer: 1, explain: '顺序为 1 → 2 → 4：访问完根 1 进入左子树，访问 2 后立刻进入它的左孩子 4。' },
    { q: '递归遍历的空间复杂度取决于？', options: ['结点总数 n', '树的深度 h', '叶子结点数', '常数 O(1)'], answer: 1, explain: '递归栈深度等于树高，最坏（单支树）为 O(n)，平衡树为 O(log n)。' },
  ],
  generate: (input) => {
    const vals = (input.length >= 1 ? input : [1, 2, 3, 4, 5, 6, 7]).slice(0, 15);
    const n = vals.length;
    const ids = vals.map((_, i) => `n${i}`);
    const baseEdges: SceneEdge[] = [];
    for (let i = 0; i < n; i++) {
      if (2 * i + 1 < n) baseEdges.push({ ...edge(ids[i], ids[2 * i + 1]), side: 'left' });
      if (2 * i + 2 < n) baseEdges.push({ ...edge(ids[i], ids[2 * i + 2]), side: 'right' });
    }
    const steps: TraceStep[] = [];
    let k = 0;
    const states: Record<string, NodeState> = {};
    const edgeStates: Record<string, 'tree' | 'active'> = {};

    const push = (anchor: string, phase: string, caption: string, stack: number[]) => {
      const current = stack.at(-1);
      const active = anchor === 'left' || anchor === 'right' ? anchor : undefined;
      const callStack = stack.map((index) => `PreOrder(${vals[index]})`);
      const nodes = vals.map((v, i) => node(ids[i], v, states[ids[i]] ?? 'default'));
      const edges = baseEdges.map((e) => ({
        ...e,
        state: edgeStates[`${e.from}>${e.to}`] ?? ('default' as const),
      }));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          { ...treeScene(nodes, edges, `层序建树：${vals.join(' ')}`), subtrees: current === undefined ? undefined : { root: ids[current], active } },
          { 当前结点: callStack.at(-1) ?? '—', 递归深度: stack.length, 已访问: Object.values(states).filter((s) => s === 'sorted').length },
          caption,
          callStack.length ? callStack : undefined,
        ),
      );
    };

    push('build', '建树', `按层序把 ${n} 个结点挂成一棵完全二叉树，根为 ${vals[0]}。`, []);

    const dfs = (i: number, stack: number[]): void => {
      if (i >= n) {
        push('guard', '递归出口', '当前子树为空，直接返回上一层。', stack);
        return;
      }
      stack.push(i);
      states[ids[i]] = 'active';
      push('visit', '访问根结点', `进入结点 ${vals[i]}，先访问根，把它记入遍历序列。`, stack);
      states[ids[i]] = 'sorted';

      if (2 * i + 1 < n) {
        edgeStates[`${ids[i]}>${ids[2 * i + 1]}`] = 'active';
        push('left', '递归左子树', `${vals[i]} 的左孩子是 ${vals[2 * i + 1]}，压栈并进入。`, stack);
        edgeStates[`${ids[i]}>${ids[2 * i + 1]}`] = 'tree';
        dfs(2 * i + 1, stack);
      } else {
        push('left', '左子树为空', `${vals[i]} 没有左孩子，跳过对左子树的递归。`, stack);
      }

      if (2 * i + 2 < n) {
        edgeStates[`${ids[i]}>${ids[2 * i + 2]}`] = 'active';
        push('right', '递归右子树', `${vals[i]} 的右孩子是 ${vals[2 * i + 2]}，压栈并进入。`, stack);
        edgeStates[`${ids[i]}>${ids[2 * i + 2]}`] = 'tree';
        dfs(2 * i + 2, stack);
      } else {
        push('right', '右子树为空', `${vals[i]} 没有右孩子，跳过对右子树的递归。`, stack);
      }

      stack.pop();
      push('ret', '回溯', `${vals[i]} 的左右子树都处理完，本次调用出栈，返回上一层。`, stack);
    };

    dfs(0, []);
    return steps;
  },
};
