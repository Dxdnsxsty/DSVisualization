import type { AlgorithmMeta, EdgeState, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [45, 24, 53, 12, 37, 93, 37];

/** 二叉排序树查找：每比较一次就下沉一层，命中或走到空指针为止。 */
export const bstSearch: AlgorithmMeta = {
  slug: 'tree/bst-search',
  title: '二叉排序树 · 查找',
  chapter: '第 9 章 查找',
  category: 'ch9',
  summary: '逐层比较，命中返回结点，空指针即失败。',
  complexity: { time: 'O(h)', space: 'O(1)', extra: 'h 为树高，平衡时 O(log n)，退化为 O(n)' },
  difficulty: '入门',
  inputHint: '输入若干整数：最后一个数是查找目标，前面的数依次插入建成二叉排序树。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: '// 先用前面的关键字建树，最后一个数是查找目标', anchor: 'build' },
      { text: 'BSTNode* Search(BSTNode *T, int k) {' },
      { text: '  while (T != NULL) {', anchor: 'loop' },
      { text: '    if (k == T->data)', anchor: 'cmp' },
      { text: '      return T;', anchor: 'found' },
      { text: '    if (k < T->data)' },
      { text: '      T = T->lchild;', anchor: 'left' },
      { text: '    else' },
      { text: '      T = T->rchild;', anchor: 'right' },
      { text: '  }' },
      { text: '  return NULL;', anchor: 'null' },
      { text: '}', anchor: 'ret' },
    ],
    python: [
      { text: '# 先用前面的关键字建树，最后一个数是查找目标', anchor: 'build' },
      { text: 'def search(t, k):' },
      { text: '    while t is not None:', anchor: 'loop' },
      { text: '        if k == t.data:', anchor: 'cmp' },
      { text: '            return t', anchor: 'found' },
      { text: '        if k < t.data:' },
      { text: '            t = t.lchild', anchor: 'left' },
      { text: '        else:' },
      { text: '            t = t.rchild', anchor: 'right' },
      { text: '    return None', anchor: 'null' },
      { text: '    # 循环结束，查找失败', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '二叉排序树的查找就是一个"二分"过程：把目标 k 与当前结点的关键字比较，相等则命中；k 更小则只可能在左子树，k 更大则只可能在右子树。每比较一次就排除掉一整棵子树，因此比较次数等于路径长度，不超过树高 h。',
      points: [
        '循环条件是 T != NULL，空指针才表示"这条路走不通"',
        '查到空指针说明整条路径都排除了，表中不存在该关键字',
        '比较次数 ≤ h，平衡树 h≈log₂n，单支树 h=n',
      ],
    },
    {
      heading: '为什么比顺序查找快',
      body: '顺序查找平均比较 n/2 次；二叉排序树每次比较都能丢掉一半左右的候选（树平衡时），只需要 O(log n) 次。代价是建树时要多花存储空间，而且树一旦退化成链就失去优势。',
    },
    {
      heading: '与折半查找的对比',
      body: '折半查找要求表有序且顺序存储，插入删除要大量移动元素；二叉排序树用链式结构，插入删除只改指针，适合动态查找表。两者都是"比较后砍掉一半"，平均效率同阶。',
    },
  ],
  quiz: [
    { q: '在二叉排序树中查找 37，比较路径上不可能出现？', options: ['比 37 小的结点', '比 37 大的结点', '等于 37 的结点', '两个都等于 37 的结点'], answer: 3, explain: '命中即返回，路径上只会有一个关键字等于目标值的结点。' },
    { q: '查找过程中指针变成 NULL 说明？', options: ['树为空，无法查找', '关键字不存在', '需要重建整棵树', '比较次数超过上限'], answer: 1, explain: '沿着比较方向已经走到叶子外的空指针，说明该路径上不存在目标关键字。' },
    { q: '对示例树（45 为根，左 24、右 53）查找 24，比较次数是？', options: ['1', '2', '3', '4'], answer: 1, explain: '第一次与 45 比较后走左子树，第二次与 24 相等即命中。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const list = raw.length >= 2 ? raw.slice(0, 10) : DEFAULT;
    const target = list[list.length - 1];
    const keys = list.slice(0, -1);
    const n = keys.length;
    const ids = keys.map((_, i) => `b${i}`);
    const left: (number | null)[] = keys.map(() => null);
    const right: (number | null)[] = keys.map(() => null);
    let root: number | null = null;

    for (let i = 0; i < n; i++) {
      if (root === null) {
        root = i;
        continue;
      }
      let cur: number = root;
      for (;;) {
        if (keys[i] < keys[cur]) {
          if (left[cur] === null) {
            left[cur] = i;
            break;
          }
          cur = left[cur] as number;
        } else {
          if (right[cur] === null) {
            right[cur] = i;
            break;
          }
          cur = right[cur] as number;
        }
      }
    }

    const steps: TraceStep[] = [];
    let k = 0;
    let comparisons = 0;
    const path: number[] = [];
    const states: Record<string, NodeState> = {};
    const edgeStates: Record<string, EdgeState> = {};

    const push = (anchor: string, phase: string, caption: string, cursor: number | null) => {
      const nodes = keys.map((v, i) => node(ids[i], v, states[ids[i]] ?? 'default'));
      const edges: SceneEdge[] = [];
      for (let i = 0; i < n; i++) {
        if (left[i] !== null) {
          const to = ids[left[i] as number];
          edges.push(edge(ids[i], to, undefined, edgeStates[`${ids[i]}>${to}`] ?? 'tree'));
        }
        if (right[i] !== null) {
          const to = ids[right[i] as number];
          edges.push(edge(ids[i], to, undefined, edgeStates[`${ids[i]}>${to}`] ?? 'tree'));
        }
      }
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          treeScene(nodes, edges, `查找 ${target}：已比较 ${comparisons} 次`),
          {
            目标值: target,
            当前结点: cursor === null ? 'NULL' : keys[cursor],
            比较次数: comparisons,
            查找路径: path.length ? path.map((i) => keys[i]).join(' → ') : '空',
          },
          caption,
        ),
      );
    };

    push('build', '建树', `用前 ${n} 个关键字依次插入建成二叉排序树，查找目标为 ${target}。`, root);

    let cur: number | null = root;
    while (cur !== null) {
      const curKey = keys[cur];
      states[ids[cur]] = 'active';
      path.push(cur);
      push('loop', '指针非空', `p 指向结点 ${curKey}，不为 NULL，进入循环继续比较。`, cur);

      comparisons += 1;
      states[ids[cur]] = 'compare';
      push('cmp', '比较关键字', `目标 ${target} 与 ${curKey} 比较：${target === curKey ? '相等，命中' : target < curKey ? '更小，应走左子树' : '更大，应走右子树'}。`, cur);

      if (target === curKey) {
        states[ids[cur]] = 'found';
        push('found', '查找成功', `命中！${target} 就在这个结点，共比较 ${comparisons} 次，返回该结点地址。`, cur);
        push('ret', '返回结点', `查找函数返回结点 ${target} 的指针，查找结束。`, cur);
        return steps.slice(0, 300);
      }

      if (target < curKey) {
        if (left[cur] === null) {
          push('left', '左指针为空', `${target} < ${curKey}，应走左子树，但 ${curKey} 没有左孩子，路走不通了。`, cur);
          cur = null;
        } else {
          edgeStates[`${ids[cur]}>${ids[left[cur] as number]}`] = 'active';
          const next = left[cur] as number;
          push('left', '进入左子树', `${target} < ${curKey}，p 移到左孩子 ${keys[next]}。`, next);
          edgeStates[`${ids[cur]}>${ids[next]}`] = 'tree';
          cur = next;
        }
      } else {
        if (right[cur] === null) {
          push('right', '右指针为空', `${target} > ${curKey}，应走右子树，但 ${curKey} 没有右孩子，路走不通了。`, cur);
          cur = null;
        } else {
          edgeStates[`${ids[cur]}>${ids[right[cur] as number]}`] = 'active';
          const next = right[cur] as number;
          push('right', '进入右子树', `${target} > ${curKey}，p 移到右孩子 ${keys[next]}。`, next);
          edgeStates[`${ids[cur]}>${ids[next]}`] = 'tree';
          cur = next;
        }
      }
    }

    push('null', '查找失败', `p 变成 NULL，说明比较路径已经走到底，${target} 不在树中。`, null);
    push('ret', '返回 NULL', '查找函数返回空指针，表示查找失败。', null);
    return steps.slice(0, 300);
  },
};
