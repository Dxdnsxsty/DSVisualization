import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

/** 入栈阶段结束后再补两个元素，用来对比「顺序栈会满、链栈不会」。 */
const EXTRA = [4, 1];

export const linkedStack: AlgorithmMeta = {
  slug: 'stack/linked-stack',
  title: '链栈 · 入栈与出栈',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: '栈顶就是表头，入栈出栈都在首结点上完成。',
  complexity: { time: 'O(1)', space: 'O(n)', extra: '每个结点多一个 next 指针的空间' },
  difficulty: '入门',
  inputHint: '输入 1–3 个整数，依次入栈；随后演示出栈与「链栈不存在栈满」的对比。',
  defaultInput: [5, 2, 9],
  input: { min: -999, max: 999, minLen: 1, maxLen: 3 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct SNode { int data; SNode *next; };' },
      { text: 'struct LinkStack { SNode *top; };  // 没有容量字段，链栈不存在栈满' },
      { text: 'void InitStack(LinkStack &S) {' },
      { text: '  S.top = NULL;', anchor: 'init' },
      { text: '}' },
      { text: 'void Push(LinkStack &S, int x) {' },
      { text: '  SNode *s = new SNode;', anchor: 'push' },
      { text: '  s->data = x;' },
      { text: '  s->next = S.top;', anchor: 'push' },
      { text: '  S.top = s;', anchor: 'push' },
      { text: '}  // 只有 malloc 失败才可能失败，不需要判满' },
      { text: 'bool Pop(LinkStack &S, int &x) {' },
      { text: '  if (S.top == NULL) return false;', anchor: 'empty' },
      { text: '  SNode *q = S.top;', anchor: 'pop' },
      { text: '  x = q->data;' },
      { text: '  S.top = q->next;', anchor: 'pop' },
      { text: '  delete q;' },
      { text: '  return true;' },
      { text: '}' },
      { text: '// 入栈出栈均为 O(1)', anchor: 'done' },
    ],
    python: [
      { text: 'class SNode:' },
      { text: '    def __init__(self, data):' },
      { text: '        self.data = data' },
      { text: '        self.next = None' },
      { text: 'class LinkStack:  # 没有容量字段，链栈不存在栈满' },
      { text: '    def __init__(self):' },
      { text: '        self.top = None', anchor: 'init' },
      { text: '    def push(self, x):' },
      { text: '        s = SNode(x)', anchor: 'push' },
      { text: '        s.next = self.top', anchor: 'push' },
      { text: '        self.top = s', anchor: 'push' },
      { text: '    def pop(self):' },
      { text: '        if self.top is None: return None', anchor: 'empty' },
      { text: '        q = self.top', anchor: 'pop' },
      { text: '        self.top = q.next', anchor: 'pop' },
      { text: '        return q.data' },
      { text: '# 入栈出栈均为 O(1)', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '链栈用单链表实现，栈顶固定在表头：入栈就是头插法插一个新结点，出栈就是删除首结点。top 既是栈顶标记，也是链表入口，操作只碰首结点，所以入栈出栈都是 O(1)。',
      points: [
        '入栈：s->next = top; top = s，两步顺序不能反',
        '出栈：先判 top == NULL，再让 top = top->next 并释放旧栈顶',
        'top 为空即空栈，不存在「容量」这个概念',
      ],
    },
    {
      heading: '为什么链栈不需要判满',
      body: '顺序栈的容量在定义时就固定为 MAXSIZE，top 顶到 MAXSIZE-1 后再入栈会越界，必须判满。链栈的结点是每次入栈时动态申请的，栈能长多大只受可用内存限制，结构里根本没有容量字段，自然也就没有上溢判定。',
      points: ['链栈仍要判空：空栈出栈是下溢，属于逻辑错误', '结点申请失败（内存耗尽）才可能失败，与栈满不是一回事', '顺序栈空间固定、缓存友好；链栈更灵活但每个结点多一个指针'],
    },
    {
      heading: '易错点',
      body: '最常见的写法错误是先执行 top = s 再执行 s->next = top，这样新结点的 next 指向了自己，整条栈链丢失。另一种是出栈时只移动 top 而不释放结点，反复入栈出栈会造成内存泄漏。',
    },
  ],
  quiz: [
    {
      q: '链栈的入栈操作为什么不需要判满？',
      options: ['因为栈的容量足够大', '因为结点是动态申请的，结构里没有容量上限', '因为 top 会自动归零', '因为出栈时会先腾出空间'],
      answer: 1,
      explain: '链栈不预留固定数组，每入栈一次才申请一个结点，只有内存耗尽才可能失败。',
    },
    {
      q: '链栈出栈时 top 指针如何变化？',
      options: ['top 加 1', 'top 减 1', 'top = top->next', 'top 不变'],
      answer: 2,
      explain: '栈顶是首结点，出栈后栈顶变成它的后继，所以执行 top = top->next。',
    },
    {
      q: '链栈入栈的两条语句正确顺序是？',
      options: ['top = s; s->next = top', 's->next = top; top = s', 's->data = top; top = s', 'top->next = s; s->next = top'],
      answer: 1,
      explain: '先让新结点指向原栈顶，再把 top 移到新结点，否则链会断。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const ok = input.length >= 1 && input.slice(0, 3).every((v) => Number.isFinite(v));
    const vals = (ok ? input : [5, 2, 9]).slice(0, 3);

    const values: Record<string, number> = {};
    const stack: string[] = [];
    let seq = 0;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      detached: string[],
      topIdx: number | null,
      vars: Record<string, string | number>,
    ) => {
      const pointers: ScenePointer[] = [
        { label: topIdx === null ? 'top=NULL' : 'top', index: topIdx },
      ];
      steps.push(makeStep(
        k++, anchor, phase,
        listScene(
          stack.map((id) => node(id, values[id], states[id] ?? 'default')),
          pointers,
          `栈长 ${stack.length} · 链栈不设容量，不存在栈满`,
          detached,
        ),
        vars, caption,
      ));
    };

    const doPush = (x: number) => {
      const id = `n${seq++}`;
      values[id] = x;
      stack.unshift(id);
      const oldTop = stack.length > 1 ? stack[1] : null;
      push(
        'push',
        '申请结点',
        `申请新结点 s，data 写入 ${x}；s->next 还没赋值，此刻它仍然游离在栈外。`,
        { [id]: 'insert' },
        [id],
        oldTop === null ? null : 1,
        { 栈顶: oldTop === null ? 'NULL' : values[oldTop], 栈长: stack.length - 1, 操作: '入栈', 数值: x },
      );
      const linked: Record<string, NodeState> = { [id]: 'found' };
      if (oldTop !== null) linked[oldTop] = 'active';
      push(
        'push',
        '表头插入',
        `s->next = top，top = s：${x} 成为新的栈顶，栈长变为 ${stack.length}。没有判满这一步。`,
        linked,
        [],
        0,
        { 栈顶: x, 栈长: stack.length, 操作: '入栈', 数值: x },
      );
    };

    const doPop = () => {
      if (stack.length === 0) {
        push(
          'empty',
          '下溢',
          'top == NULL，栈空，没有元素可取（下溢）。链栈虽然不会满，但出栈前仍必须判空。',
          {},
          [],
          null,
          { 栈顶: 'NULL', 栈长: 0, 操作: '出栈', 数值: '—' },
        );
        return;
      }
      const id = stack[0];
      const v = values[id];
      push(
        'pop',
        '取栈顶',
        `栈顶 data = ${v}，准备把它从表头摘下；栈顶的 next 就是出栈后的新栈顶。`,
        { [id]: 'delete' },
        [],
        0,
        { 栈顶: v, 栈长: stack.length, 操作: '出栈', 数值: v },
      );
      stack.shift();
      push(
        'pop',
        'top 后移',
        `top = top->next，top 现在指向${stack.length === 0 ? ' NULL，栈已空' : `值 ${values[stack[0]]} 的结点`}，栈长 ${stack.length}。`,
        {},
        [],
        stack.length === 0 ? null : 0,
        { 栈顶: stack.length === 0 ? 'NULL' : values[stack[0]], 栈长: stack.length, 操作: '出栈', 数值: v },
      );
    };

    push('init', '初始化', 'top = NULL，得到空链栈。结构里没有 MAXSIZE，所以后面入栈永远不会遇到「栈满」。', {}, [], null, { 栈顶: 'NULL', 栈长: 0, 操作: '初始化', 数值: '—' });

    vals.forEach((v) => doPush(v));
    doPop();

    EXTRA.forEach((v) => doPush(v));
    push('push', '对比顺序栈', `栈长已达 ${stack.length}，若容量只有 6 的顺序栈早已接近上限；链栈只要内存够就能继续入栈。`, {}, [], 0, { 栈顶: values[stack[0]], 栈长: stack.length, 操作: '对比', 数值: '—' });

    while (stack.length > 0) doPop();
    doPop();

    push('done', '结束', '入栈是头插、出栈是删头，都只改 top，均为 O(1)；代价是每个结点多一个指针域。', {}, [], null, { 栈顶: 'NULL', 栈长: 0, 操作: '结束', 数值: '—' });
    return steps;
  },
};
