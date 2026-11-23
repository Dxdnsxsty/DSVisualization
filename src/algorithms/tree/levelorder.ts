import type { AlgorithmMeta, EdgeState, NodeState, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

const DEFAULT = [1, 2, 3, 4, 5, 6, 7];

/** 层次遍历：用一个队列，出队一个就把它的孩子依次入队，逐层向外扩展。 */
export const levelorderTree: AlgorithmMeta = {
  slug: 'tree/levelorder',
  title: '二叉树 · 层次遍历',
  chapter: '第 7 章 树和二叉树',
  category: 'ch7',
  summary: '队列逐层扩展，先进先出保证按层访问。',
  complexity: { time: 'O(n)', space: 'O(w)', extra: 'w 为树的最大宽度，即队列峰值' },
  difficulty: '入门',
  inputHint: '输入 2–15 个整数，按层序建完全二叉树（第 i 个结点的孩子是 2i+1、2i+2）。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 15 },
  code: {
    cpp: [
      { text: '// 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'void LevelOrder(BTNode *b) {' },
      { text: '  SqQueue q; InitQueue(&q);', anchor: 'init' },
      { text: '  if (b != NULL) enQueue(&q, b);', anchor: 'pushroot' },
      { text: '  while (!QueueEmpty(q)) {', anchor: 'loop' },
      { text: '    BTNode *p; deQueue(&q, &p);', anchor: 'deq' },
      { text: '    printf("%d ", p->data);', anchor: 'visit' },
      { text: '    if (p->lchild != NULL) enQueue(&q, p->lchild);', anchor: 'enql' },
      { text: '    if (p->rchild != NULL) enQueue(&q, p->rchild);', anchor: 'enqr' },
      { text: '  }' },
      { text: '}', anchor: 'done' },
    ],
    python: [
      { text: '# 按层序数组建完全二叉树', anchor: 'build' },
      { text: 'from collections import deque' },
      { text: 'def level_order(b):' },
      { text: '    q = deque()', anchor: 'init' },
      { text: '    if b is not None: q.append(b)', anchor: 'pushroot' },
      { text: '    while q:', anchor: 'loop' },
      { text: '        p = q.popleft()', anchor: 'deq' },
      { text: '        print(p.data)', anchor: 'visit' },
      { text: '        if p.lchild is not None: q.append(p.lchild)', anchor: 'enql' },
      { text: '        if p.rchild is not None: q.append(p.rchild)', anchor: 'enqr' },
      { text: '    # 队列为空，遍历结束', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '层次遍历不走递归，而是借一个队列：根先入队；只要队列不空，就取出队首结点访问，并把它非空的左右孩子依次入队。队列「先进先出」的特性天然保证了先入队的上层结点先被访问，于是输出顺序就是从上到下、从左到右。',
      points: [
        '入队顺序固定为「先左后右」，否则同一层的输出会左右颠倒',
        '队列里最多同时存放一层的结点，空间是 O(w) 而不是 O(h)',
        '必须在出队时判空孩子，空指针不能入队',
      ],
    },
    {
      heading: '为什么它等价于按层输出',
      body: '把队列看成一条传送带：第 k 层的结点全部排在队列里时，第 k+1 层的结点只会被追加到队尾，绝不会插到队首。因此第 k 层访问完之前，第 k+1 层一个都不会被取出，输出自然按层分组。',
    },
    {
      heading: '常见变形',
      body: '若想知道"每一层有哪些结点"，可以在每轮循环开始前记下当前队列长度 len，只出队 len 个结点，这一批就是同一层；求树宽、按层打印、判断完全二叉树都用这个技巧。',
    },
  ],
  quiz: [
    { q: '层次遍历需要借助哪种数据结构？', options: ['栈', '队列', '优先队列', '哈希表'], answer: 1, explain: '先进先出才能保证上层结点先于下层结点被访问，所以用队列。' },
    { q: '层次遍历的空间复杂度取决于？', options: ['树高 h', '结点总数 n', '树的最大宽度 w', '常数 O(1)'], answer: 2, explain: '队列峰值出现在最宽的一层，约等于该层结点数，即 O(w)。' },
    { q: '对层序为 1 2 3 4 5 6 7 的完全二叉树做层次遍历，输出是？', options: ['1 2 3 4 5 6 7', '1 2 4 5 3 6 7', '4 2 5 1 6 3 7', '7 6 5 4 3 2 1'], answer: 0, explain: '逐层从左到右，正好就是建树时的层序数组。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const vals = (raw.length >= 2 ? raw : DEFAULT).slice(0, 15);
    const n = vals.length;
    const ids = vals.map((_, i) => `n${i}`);
    const baseEdges: SceneEdge[] = [];
    for (let i = 0; i < n; i++) {
      if (2 * i + 1 < n) baseEdges.push(edge(ids[i], ids[2 * i + 1]));
      if (2 * i + 2 < n) baseEdges.push(edge(ids[i], ids[2 * i + 2]));
    }
    const steps: TraceStep[] = [];
    let k = 0;
    const states: Record<string, NodeState> = {};
    const edgeStates: Record<string, EdgeState> = {};
    const queue: number[] = [];
    let head = 0;
    const seq: number[] = [];

    const queueText = () => (head < queue.length ? queue.slice(head).map((i) => vals[i]).join(' ') : '空');

    const push = (anchor: string, phase: string, caption: string) => {
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
            ...treeScene(nodes, edges, `队列：[${queueText()}]`),
            aux: {
              label: '待访问结点队列',
              layout: 'queue',
              nodes: queue.slice(head).map((index, position, pending) => node(ids[index], vals[index],
                position === pending.length - 1 && ['pushroot', 'enql', 'enqr'].includes(anchor) && phase.includes('入队')
                  ? 'insert' : position === 0 ? 'active' : 'default')),
            },
          },
          {
            队首: head < queue.length ? vals[queue[head]] : '空',
            队尾: head < queue.length ? vals[queue[queue.length - 1]] : '空',
            队列内容: queueText(),
            已访问: seq.length,
          },
          caption,
        ),
      );
    };

    push('build', '建树', `按层序把 ${n} 个结点挂成完全二叉树，根为 ${vals[0]}。`);
    push('init', '初始化队列', '创建一个空队列，准备存放待访问的结点。');

    queue.push(0);
    states[ids[0]] = 'active';
    push('pushroot', '根结点入队', `根 ${vals[0]} 入队，队列里只有它一个。`);

    while (head < queue.length && steps.length < 299) {
      push('loop', '判断队列非空', `队列不空，队首是 ${vals[queue[head]]}，可以继续出队访问。`);
      const cur = queue[head++];
      states[ids[cur]] = 'found';
      push('deq', '队首出队', `${vals[cur]} 出队，成为当前处理结点。`);

      states[ids[cur]] = 'visited';
      seq.push(vals[cur]);
      push('visit', '访问结点', `访问 ${vals[cur]}，它是层次序列的第 ${seq.length} 个结点。`);

      const l = 2 * cur + 1;
      const r = 2 * cur + 2;
      if (l < n) {
        edgeStates[`${ids[cur]}>${ids[l]}`] = 'active';
        queue.push(l);
        states[ids[l]] = 'active';
        push('enql', '左孩子入队', `${vals[cur]} 的左孩子 ${vals[l]} 入队，排在队尾。`);
        edgeStates[`${ids[cur]}>${ids[l]}`] = 'tree';
      } else {
        push('enql', '左孩子为空', `${vals[cur]} 没有左孩子，跳过入队。`);
      }

      if (r < n) {
        edgeStates[`${ids[cur]}>${ids[r]}`] = 'active';
        queue.push(r);
        states[ids[r]] = 'active';
        push('enqr', '右孩子入队', `${vals[cur]} 的右孩子 ${vals[r]} 入队，排在队尾。`);
        edgeStates[`${ids[cur]}>${ids[r]}`] = 'tree';
      } else {
        push('enqr', '右孩子为空', `${vals[cur]} 没有右孩子，跳过入队。`);
      }
    }

    push('done', '遍历结束', `队列已空，层次遍历完成，序列为 ${seq.join(' ')}。`);
    return steps.slice(0, 300);
  },
};
