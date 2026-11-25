import { levelTree, TREE_LEVEL_INPUT } from '../../engine/structure-input';
import type { AlgorithmMeta, EdgeState, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [1, 2, 3, 4, 5, 6, 7];

/** 中序遍历：左子树 → 根 → 右子树，递归栈深度等于树高。 */
export const inorderTree: AlgorithmMeta = {
  slug: 'tree/inorder',
  title: '二叉树 · 中序遍历',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '左 → 根 → 右，先递归到底再回头访问。',
  complexity: { time: 'O(n)', space: 'O(h)', extra: 'h 为树高，递归栈深度' },
  difficulty: '入门',
  inputHint: '按层序输入 1–15 个结点，支持整数或单个英文字母。用 null 表示空孩子，如 A, B, C, null, D。',
  defaultInput: DEFAULT,
  input: TREE_LEVEL_INPUT,
  code: {
    cpp: [
      { text: '// 按层序输入建树，null 表示空孩子', anchor: 'build' },
      { text: 'void InOrder(BTNode *b) {' },
      { text: '  if (b == NULL) return;', anchor: 'guard' },
      { text: '  InOrder(b->lchild);', anchor: 'left' },
      { text: '  printf("%d ", b->data);', anchor: 'visit' },
      { text: '  InOrder(b->rchild);', anchor: 'right' },
      { text: '}', anchor: 'ret' },
    ],
    python: [
      { text: '# 按层序输入建树，null 表示空孩子', anchor: 'build' },
      { text: 'def inorder(b):' },
      { text: '    if b is None:', anchor: 'guard' },
      { text: '        return' },
      { text: '    inorder(b.lchild)', anchor: 'left' },
      { text: '    print(b.data)', anchor: 'visit' },
      { text: '    inorder(b.rchild)', anchor: 'right' },
      { text: '    # 返回上层调用', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '中序遍历的访问次序是「左子树 → 根 → 右子树」。函数的执行顺序被拆成三段：先把自己压栈并进入左子树，等左子树整棵处理完返回后，才轮到自己被访问，最后再进入右子树。所以第一个被访问的结点一定是最左边的结点。',
      points: [
        '结点被访问的时刻，是它的左子树已经全部返回之后',
        '中序序列的第一个结点是最左下结点，最后一个是最右下结点',
        '对二叉排序树做中序遍历，得到的是递增有序序列',
      ],
    },
    {
      heading: '递归栈怎么变化',
      body: '进入一个结点就压栈，左子树返回后该结点成为栈顶，此时才可以访问它；右子树返回后它才出栈。舞台下方的调用栈面板自上而下就是「当前路径」，栈顶永远与舞台高亮的结点一致。',
    },
    {
      heading: '易错点',
      body: '最常见的错误是先 printf 再递归左子树，那就退化成先序遍历了。另一个错误是忘记判空出口，空指针会被当成结点访问。',
    },
  ],
  quiz: [
    { q: '中序遍历的访问顺序是？', options: ['根 → 左 → 右', '左 → 根 → 右', '左 → 右 → 根', '按层从左到右'], answer: 1, explain: '中序（InOrder）先递归左子树，再访问根，最后递归右子树。' },
    { q: '对层序为 1 2 3 4 5 6 7 的完全二叉树中序遍历，第一个被访问的结点是？', options: ['1', '2', '4', '7'], answer: 2, explain: '中序一路向左走到最左下结点，路径 1 → 2 → 4，所以第一个是 4。' },
    { q: '对二叉排序树做中序遍历的结果是？', options: ['递减序列', '递增序列', '层序序列', '不确定'], answer: 1, explain: '左子树全部小于根、右子树全部大于根，中序「左根右」刚好得到从小到大的序列。' },
  ],
  generate: (input) => {
    const { vals, left, right, height } = levelTree(input.length ? input : DEFAULT);
    const n = vals.length;
    const ids = vals.map((_, i) => `n${i}`);
    const baseEdges: SceneEdge[] = [];
    for (let i = 0; i < n; i++) {
      if (left[i] >= 0) baseEdges.push({ ...edge(ids[i], ids[left[i]]), side: 'left' });
      if (right[i] >= 0) baseEdges.push({ ...edge(ids[i], ids[right[i]]), side: 'right' });
    }
    const steps: TraceStep[] = [];
    let k = 0;
    const states: Record<string, NodeState> = {};
    const edgeStates: Record<string, EdgeState> = {};
    const seq: (number | string)[] = [];

    const push = (anchor: string, phase: string, caption: string, stack: number[]) => {
      const current = stack.at(-1);
      const active = anchor === 'left' || anchor === 'right' ? anchor : undefined;
      const callStack = stack.map((index) => `InOrder(${vals[index]})`);
      const nodes = vals.map((v, i) => node(ids[i], v, states[ids[i]] ?? 'default'));
      const edges = baseEdges.map((e) => ({
        ...e,
        state: edgeStates[`${e.from}>${e.to}`] ?? ('default' as EdgeState),
      }));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...treeScene(nodes, edges, `中序序列：${seq.length ? seq.join(' ') : '空'}`),
            subtrees: current === undefined ? undefined : { root: ids[current], active },
            aux: { label: '中序遍历调用栈', layout: 'call-stack', capacity: height,
              nodes: stack.map((index, at) => node(ids[index], callStack[at], at === stack.length - 1 ? 'active' : 'default')),
              pointers: [{ label: 'top', index: stack.length ? stack.length - 1 : null }] },
            output: { label: '中序访问序列', values: seq.map(String) },
          },
          {
            当前结点: callStack.at(-1) ?? '—',
            递归深度: stack.length,
            已访问: seq.length,
            中序序列: seq.length ? seq.join(' ') : '空',
          },
          caption,
          callStack.length ? callStack : undefined,
        ),
      );
    };

    push('build', '建树', `按层序把 ${n} 个结点连接成二叉树，根为 ${vals[0]}。`, []);

    const dfs = (i: number, stack: number[]): void => {
      if (i >= n) {
        push('guard', '递归出口', '子树为空，不访问任何结点，直接返回上一层。', stack);
        return;
      }
      stack.push(i);
      states[ids[i]] = 'active';

      if (left[i] >= 0) {
        edgeStates[`${ids[i]}>${ids[left[i]]}`] = 'active';
        push('left', '递归左子树', `进入 ${vals[i]}，中序必须先处理左子树，压栈进入左孩子 ${vals[left[i]]}。`, stack);
        edgeStates[`${ids[i]}>${ids[left[i]]}`] = 'tree';
        dfs(left[i], stack);
      } else {
        push('left', '左子树为空', `${vals[i]} 没有左孩子，左子树这一步立即返回。`, stack);
      }

      states[ids[i]] = 'sorted';
      seq.push(vals[i]);
      push('visit', '访问根结点', `左子树处理完，回到 ${vals[i]} 并访问它，记入中序序列（第 ${seq.length} 个）。`, stack);

      if (right[i] >= 0) {
        edgeStates[`${ids[i]}>${ids[right[i]]}`] = 'active';
        push('right', '递归右子树', `根已访问，最后处理右子树，进入 ${vals[i]} 的右孩子 ${vals[right[i]]}。`, stack);
        edgeStates[`${ids[i]}>${ids[right[i]]}`] = 'tree';
        dfs(right[i], stack);
      } else {
        push('right', '右子树为空', `${vals[i]} 没有右孩子，右子树这一步立即返回。`, stack);
      }

      stack.pop();
      push('ret', '回溯', `${vals[i]} 的左、根、右全部处理完，本次调用出栈，回到上一层。`, stack);
    };

    dfs(0, []);
    return steps.slice(0, 300);
  },
};
