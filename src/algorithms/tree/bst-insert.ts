import type { AlgorithmMeta, EdgeState, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [45, 24, 53, 12, 37, 93];

/** 二叉排序树插入：从根开始比较，小往左、大往右，直到遇到空指针再挂上新结点。 */
export const bstInsert: AlgorithmMeta = {
  slug: 'tree/bst-insert',
  title: '二叉排序树 · 插入',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '比较到底，新结点总挂在空指针上。',
  complexity: { time: 'O(h)', space: 'O(1)', extra: 'h 为树高，最坏（有序插入）退化为 O(n)' },
  difficulty: '入门',
  inputHint: '输入 3–9 个互不相同的整数，按顺序逐个插入二叉排序树。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 9 },
  code: {
    cpp: [
      { text: '// 二叉排序树插入：比较到空指针再挂结点', anchor: 'start' },
      { text: 'void Insert(BSTNode *&T, int k) {' },
      { text: '  if (T == NULL) {', anchor: 'empty' },
      { text: '    T = new BSTNode(k);', anchor: 'attach' },
      { text: '    return;' },
      { text: '  }' },
      { text: '  if (k < T->data)', anchor: 'cmp' },
      { text: '    Insert(T->lchild, k);', anchor: 'left' },
      { text: '  else' },
      { text: '    Insert(T->rchild, k);', anchor: 'right' },
      { text: '}', anchor: 'ret' },
    ],
    python: [
      { text: '# 二叉排序树插入：比较到空指针再挂结点', anchor: 'start' },
      { text: 'def insert(t, k):' },
      { text: '    if t is None:', anchor: 'empty' },
      { text: '        return Node(k)', anchor: 'attach' },
      { text: '    if k < t.data:', anchor: 'cmp' },
      { text: '        t.lchild = insert(t.lchild, k)', anchor: 'left' },
      { text: '    else:' },
      { text: '        t.rchild = insert(t.rchild, k)', anchor: 'right' },
      { text: '    return t', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '二叉排序树满足：左子树所有结点小于根，右子树所有结点大于根。插入时从根出发，把关键字与当前结点比较，小就走左指针、大就走右指针，一直走到某个空指针，新结点就挂在这个空位置上，成为叶子。',
      points: [
        '插入的结点一定是叶子，不会插到已有结点中间',
        '树的结构由插入顺序决定，同一组关键字换个顺序形状就不同',
        '已存在相同关键字时通常不重复插入（本例约定相等往右走，实际应判重）',
      ],
    },
    {
      heading: '为什么要找空指针',
      body: '查找路径上的每个结点都只提供"往哪边走"的信息，真正的落点必须是一个空指针：只有空指针才表示"这个位置还没有结点"。所以插入的终止条件是 T == NULL，而不是某个结点的值等于 k。',
    },
    {
      heading: '效率与退化',
      body: '每次插入的比较次数等于路径长度，平均 O(log n)，但按 1、2、3、4… 递增顺序插入时，树会退化成一条单支链，高度变成 n，插入退化为 O(n)。这正是二叉排序树需要平衡化（AVL、红黑树）的原因。',
    },
  ],
  quiz: [
    { q: '向二叉排序树插入新结点时，新结点一定成为？', options: ['根结点', '叶子结点', '某个结点的父结点', '不确定'], answer: 1, explain: '插入总是沿着比较路径走到空指针处挂上，因此新结点没有孩子，是叶子。' },
    { q: '依次插入 45、24、53、12、37，关键字 37 会成为谁的右孩子？', options: ['45', '24', '53', '12'], answer: 1, explain: '37 < 45 往左到 24，37 > 24 往右且右指针为空，所以是 24 的右孩子。' },
    { q: '按递增顺序 1、2、3、…、n 依次插入，树高是？', options: ['log n', 'n/2', 'n', '1'], answer: 2, explain: '每个新结点都挂在最右端，形成单支树，高度为 n，查找退化为 O(n)。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const keys = (raw.length >= 2 ? raw : DEFAULT).slice(0, 9);
    const ids = keys.map((_, i) => `b${i}`);
    const left: (number | null)[] = keys.map(() => null);
    const right: (number | null)[] = keys.map(() => null);
    const inserted: number[] = [];
    let root: number | null = null;
    const steps: TraceStep[] = [];
    let k = 0;
    let currentKey = keys[0];
    let comparisons = 0;
    const pathState: Record<string, NodeState> = {};
    const pathEdge: Record<string, EdgeState> = {};

    const heightOf = (r: number | null): number =>
      r === null ? 0 : 1 + Math.max(heightOf(left[r]), heightOf(right[r]));

    const push = (anchor: string, phase: string, caption: string, cursor: number | null) => {
      const nodes = inserted.map((i) => node(ids[i], keys[i], pathState[ids[i]] ?? 'default'));
      const edges: SceneEdge[] = [];
      for (const i of inserted) {
        if (left[i] !== null) {
          const to = ids[left[i] as number];
          edges.push({ ...edge(ids[i], to, undefined, pathEdge[`${ids[i]}>${to}`] ?? 'tree'), side: 'left' });
        }
        if (right[i] !== null) {
          const to = ids[right[i] as number];
          edges.push({ ...edge(ids[i], to, undefined, pathEdge[`${ids[i]}>${to}`] ?? 'tree'), side: 'right' });
        }
      }
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          treeScene(nodes, edges, `已插入 ${inserted.length} / ${keys.length} 个关键字`),
          {
            插入关键字: currentKey,
            比较次数: comparisons,
            当前结点: cursor === null ? 'NULL' : keys[cursor],
            已插入结点: inserted.length,
            树高: heightOf(root),
          },
          caption,
        ),
      );
    };

    for (let idx = 0; idx < keys.length; idx++) {
      currentKey = keys[idx];
      comparisons = 0;
      for (const key of Object.keys(pathState)) delete pathState[key];
      for (const key of Object.keys(pathEdge)) delete pathEdge[key];
      push('start', '开始插入', `准备插入第 ${idx + 1} 个关键字 ${currentKey}，从根开始比较。`, root);

      if (root === null) {
        push('empty', '树为空', '当前是一棵空树，空指针位置就是新结点的落点。', null);
      } else {
        let cur = root;
        for (;;) {
          pathState[ids[cur]] = 'compare';
          comparisons += 1;
          const goLeft = currentKey < keys[cur];
          push(
            'cmp',
            '比较关键字',
            `${currentKey} 与 ${keys[cur]} 比较：${currentKey === keys[cur] ? '相等，约定往右走' : goLeft ? '更小，应走左子树' : '更大，应走右子树'}。`,
            cur,
          );
          if (goLeft) {
            if (left[cur] !== null) {
              const key = `${ids[cur]}>${ids[left[cur] as number]}`;
              pathEdge[key] = 'active';
              push('left', '向左子树下沉', `${currentKey} < ${keys[cur]}，进入左孩子 ${keys[left[cur] as number]}。`, left[cur]);
              pathEdge[key] = 'tree';
              cur = left[cur] as number;
            } else {
              push('empty', '找到空位置', `${keys[cur]} 的左指针为空，${currentKey} 就挂在这个位置。`, cur);
              break;
            }
          } else {
            if (right[cur] !== null) {
              const key = `${ids[cur]}>${ids[right[cur] as number]}`;
              pathEdge[key] = 'active';
              push('right', '向右子树下沉', `${currentKey} >= ${keys[cur]}，进入右孩子 ${keys[right[cur] as number]}。`, right[cur]);
              pathEdge[key] = 'tree';
              cur = right[cur] as number;
            } else {
              push('empty', '找到空位置', `${keys[cur]} 的右指针为空，${currentKey} 就挂在这个位置。`, cur);
              break;
            }
          }
        }
      }

      // 挂上新结点：空树则成为根，否则接到刚才的空指针上
      const parentIsRoot = root === null;
      if (parentIsRoot) {
        root = idx;
      } else {
        let cur = root as number;
        for (;;) {
          if (currentKey < keys[cur]) {
            if (left[cur] === null) {
              left[cur] = idx;
              pathEdge[`${ids[cur]}>${ids[idx]}`] = 'active';
              break;
            }
            cur = left[cur] as number;
          } else {
            if (right[cur] === null) {
              right[cur] = idx;
              pathEdge[`${ids[cur]}>${ids[idx]}`] = 'active';
              break;
            }
            cur = right[cur] as number;
          }
        }
      }
      inserted.push(idx);
      pathState[ids[idx]] = 'insert';
      push('attach', '挂上新结点', `新建结点 ${currentKey} 并接到空指针上，它成为叶子。`, idx);
      for (const key of Object.keys(pathEdge)) pathEdge[key] = 'tree';
      push('ret', '递归返回', `Insert 逐层返回，${currentKey} 已就位，树中现有 ${inserted.length} 个结点。`, null);
    }

    return steps.slice(0, 300);
  },
};
