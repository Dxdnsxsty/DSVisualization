import type { AlgorithmMeta, EdgeState, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [1, 2, 3, 4, 5, 6, 7];

/** 后序遍历：左子树 → 右子树 → 根，根最后才被访问。 */
export const postorderTree: AlgorithmMeta = {
  slug: 'tree/postorder',
  title: '二叉树 · 后序遍历',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '左 → 右 → 根，等两棵子树都返回再访问根。',
  complexity: { time: 'O(n)', space: 'O(h)', extra: 'h 为树高，递归栈深度' },
  difficulty: '入门',
  inputHint: '输入 3–15 个整数，按层序建完全二叉树（第 i 个结点的孩子是 2i+1、2i+2）。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 15 },
  code: {
    cpp: [
      { text: '// 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'void PostOrder(BTNode *b) {' },
      { text: '  if (b == NULL) return;', anchor: 'guard' },
      { text: '  PostOrder(b->lchild);', anchor: 'left' },
      { text: '  PostOrder(b->rchild);', anchor: 'right' },
      { text: '  printf("%d ", b->data);', anchor: 'visit' },
      { text: '}', anchor: 'ret' },
    ],
    python: [
      { text: '# 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'def postorder(b):' },
      { text: '    if b is None:', anchor: 'guard' },
      { text: '        return' },
      { text: '    postorder(b.lchild)', anchor: 'left' },
      { text: '    postorder(b.rchild)', anchor: 'right' },
      { text: '    print(b.data)', anchor: 'visit' },
      { text: '    # 返回上层调用', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '后序遍历把根的访问放在最后：先递归左子树，再递归右子树，两棵子树都返回之后才访问根。因此后序序列的最后一个元素一定是整棵树的根，整棵树要等到所有后代都处理完，根才第一次被"真正使用"。',
      points: [
        '访问根的时机是左右子树都返回之后，不是进入时',
        '后序序列的最后一个结点是根，第一个结点是最左下的叶子',
        '递归栈里同时保存着"还没访问的根"，所以空间仍是 O(h)',
      ],
    },
    {
      heading: '为什么必须等左右子树',
      body: '很多操作依赖「子树的结果算完，才能处理根」。释放二叉树时，必须先 free 左、右孩子再 free 根，否则根一释放就再也找不到孩子，造成内存泄漏；求表达式树的值时，必须先算出左右子树的值，才能用根上的运算符把它们合并。这两类场景正是后序遍历。',
    },
    {
      heading: '与先序、中序的对比',
      body: '三种遍历的递归路线完全相同，区别只在 printf 放在哪个位置：先序放最前，中序放中间，后序放最后。把 printf 换成一个「处理根」的操作，就得到对应的应用，所以遍历框架是同一套。',
    },
  ],
  quiz: [
    { q: '后序遍历的访问顺序是？', options: ['根 → 左 → 右', '左 → 根 → 右', '左 → 右 → 根', '右 → 左 → 根'], answer: 2, explain: '后序（PostOrder）先左子树、再右子树，最后才访问根。' },
    { q: '释放一棵二叉树应该用哪种遍历？', options: ['先序', '中序', '后序', '层次'], answer: 2, explain: '必须先释放孩子再释放根，否则根释放后孩子指针丢失，用后序最自然。' },
    { q: '对层序为 1 2 3 4 5 6 7 的完全二叉树后序遍历，最后被访问的结点是？', options: ['1', '4', '7', '3'], answer: 0, explain: '后序最后访问根，整棵树的根是 1。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const vals = (raw.length >= 2 ? raw : DEFAULT).slice(0, 15);
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
    const edgeStates: Record<string, EdgeState> = {};
    const seq: number[] = [];

    const push = (anchor: string, phase: string, caption: string, stack: number[]) => {
      const current = stack.at(-1);
      const active = anchor === 'left' || anchor === 'right' ? anchor : undefined;
      const callStack = stack.map((index) => `PostOrder(${vals[index]})`);
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
            ...treeScene(nodes, edges, `后序序列：${seq.length ? seq.join(' ') : '空'}`),
            subtrees: current === undefined ? undefined : { root: ids[current], active },
            aux: { label: '后序遍历调用栈', layout: 'call-stack', capacity: Math.floor(Math.log2(n)) + 1,
              nodes: stack.map((index, at) => node(ids[index], callStack[at], at === stack.length - 1 ? 'active' : 'default')),
              pointers: [{ label: 'top', index: stack.length ? stack.length - 1 : null }] },
            output: { label: '后序访问序列', values: seq.map(String) },
          },
          {
            当前结点: callStack.at(-1) ?? '—',
            递归深度: stack.length,
            已访问: seq.length,
            后序序列: seq.length ? seq.join(' ') : '空',
          },
          caption,
          callStack.length ? callStack : undefined,
        ),
      );
    };

    push('build', '建树', `按层序把 ${n} 个结点挂成完全二叉树，根为 ${vals[0]}。`, []);

    const dfs = (i: number, stack: number[]): void => {
      if (i >= n) {
        push('guard', '递归出口', '子树为空，直接返回上一层，不访问任何结点。', stack);
        return;
      }
      stack.push(i);
      states[ids[i]] = 'active';

      if (2 * i + 1 < n) {
        edgeStates[`${ids[i]}>${ids[2 * i + 1]}`] = 'active';
        push('left', '递归左子树', `进入 ${vals[i]}，先处理左子树，压栈进入左孩子 ${vals[2 * i + 1]}。`, stack);
        edgeStates[`${ids[i]}>${ids[2 * i + 1]}`] = 'tree';
        dfs(2 * i + 1, stack);
      } else {
        push('left', '左子树为空', `${vals[i]} 没有左孩子，左子树这一步立即返回。`, stack);
      }

      if (2 * i + 2 < n) {
        edgeStates[`${ids[i]}>${ids[2 * i + 2]}`] = 'active';
        push('right', '递归右子树', `左子树已完成，接着进入 ${vals[i]} 的右孩子 ${vals[2 * i + 2]}。`, stack);
        edgeStates[`${ids[i]}>${ids[2 * i + 2]}`] = 'tree';
        dfs(2 * i + 2, stack);
      } else {
        push('right', '右子树为空', `${vals[i]} 没有右孩子，右子树这一步立即返回。`, stack);
      }

      states[ids[i]] = 'sorted';
      seq.push(vals[i]);
      push('visit', '访问根结点', `左右子树都返回了，此时才轮到 ${vals[i]}，记入后序序列（第 ${seq.length} 个）。`, stack);

      stack.pop();
      push('ret', '回溯', `${vals[i]} 整棵子树处理完毕，本次调用出栈，返回上一层。`, stack);
    };

    dfs(0, []);
    return steps.slice(0, 300);
  },
};
