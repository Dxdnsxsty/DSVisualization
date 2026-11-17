import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

export const linkHeadInsert: AlgorithmMeta = {
  slug: 'list/link-head-node',
  title: '单链表 · 头插法建立',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '逐个把新结点插到头指针之后，观察指针修改顺序。',
  complexity: { time: 'O(n)', space: 'O(n)', extra: '每个结点插入 O(1)' },
  difficulty: '入门',
  inputHint: '输入若干整数，按输入顺序依次执行头插法；观察最终链表顺序与输入相反。',
  defaultInput: [10, 20, 30, 40],
  input: { min: -999, max: 999, minLen: 1, maxLen: 8 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct LNode { int data; LNode *next; };' },
      { text: 'LNode* CreateHead(int A[], int n) {' },
      { text: '  LNode *head = NULL;', anchor: 'init' },
      { text: '  for (int i = 0; i < n; i++) {' },
      { text: '    LNode *s = new LNode;', anchor: 'alloc' },
      { text: '    s->data = A[i];' },
      { text: '    s->next = head;', anchor: 'link' },
      { text: '    head = s;', anchor: 'head' },
      { text: '  }' },
      { text: '  return head;', anchor: 'done' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  int A[] = {10, 20, 30, 40};' },
      { text: '  for (LNode *p = CreateHead(A, 4); p; p = p->next)' },
      { text: '    std::cout << p->data << " ";' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'class Node:' },
      { text: '    def __init__(self, data):' },
      { text: '        self.data = data' },
      { text: '        self.next = None' },
      { text: 'def create_head(A):' },
      { text: '    head = None', anchor: 'init' },
      { text: '    for v in A:' },
      { text: '        s = Node(v)', anchor: 'alloc' },
      { text: '        s.next = head', anchor: 'link' },
      { text: '        head = s', anchor: 'head' },
      { text: '    return head', anchor: 'done' },
      { text: 'p = create_head([10, 20, 30, 40])' },
      { text: 'while p: print(p.data); p = p.next' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '头插法每次把新结点接到现有链表的头部：先申请结点，再让它的 next 指向原首结点，最后把 head 改指向新结点。三步顺序不能颠倒，否则会丢失整条链。',
      points: ['初始化 head = NULL，空链表也适用，无需特判', 's->next = head 必须在 head = s 之前', '最终链表顺序与输入顺序相反，可用于逆置'],
    },
    {
      heading: '不带头结点的情况',
      body: '本演示不设头结点，head 直接指向第一个数据结点。第一次插入时 head 为 NULL，s->next = NULL 自然形成链尾，代码无需分支处理，这正是头插法简洁的原因。',
    },
    {
      heading: '复杂度与易错点',
      body: '每个结点插入 O(1)，建立 n 个结点共 O(n) 时间、O(n) 空间。',
      points: ['先写 head = s 会导致原链表再也找不到（断链）', '忘记给 s->next 赋值会产生野指针', '遍历时误把 head 本身当作数据结点'],
    },
  ],
  quiz: [
    { q: '输入 10, 20, 30, 40 用头插法建立，链表从头到尾的顺序是？', options: ['10 20 30 40', '40 30 20 10', '10 40 30 20', '随机'], answer: 1, explain: '每次新结点都插到最前面，因此最终顺序与输入完全相反。' },
    { q: '若把 head = s 写在 s->next = head 之前会怎样？', options: ['没有区别', '原链表丢失，只剩新结点', '编译报错', '结点重复'], answer: 1, explain: 'head 被覆盖后，原来的首结点地址再也取不到，链表断裂。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const vals = (input.length >= 1 ? input : [10, 20, 30, 40]).slice(0, 8);
    const ids: string[] = [];
    const values: Record<string, number> = {};
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      pointers: ScenePointer[],
      vars: Record<string, string | number>,
      states: Record<string, NodeState> = {},
      detached: string[] = [],
    ) => {
      steps.push(makeStep(
        k++, anchor, phase,
        listScene(ids.map((id) => node(id, values[id], states[id] ?? 'default')), pointers, `结点数 ${ids.length}`, detached),
        vars, caption,
      ));
    };

    push('init', '初始化', '建立空链表：head = NULL，此时没有任何数据结点。', [{ label: 'head', index: null }], { head: 'NULL', 已插入: 0 });

    vals.forEach((v, idx) => {
      const id = `n${idx}`;
      values[id] = v;
      ids.unshift(id);
      const oldHead = ids.length > 1 ? values[ids[1]] : 'NULL';
      const p: ScenePointer[] = [
        { label: 's', index: 0 },
        { label: 'head', index: ids.length > 1 ? 1 : null },
      ];
      push('alloc', '申请结点', `申请新结点 s，数据域写入 ${v}；此时 s->next 尚未连接。`, p,
        { s: v, head: oldHead, 已插入: idx + 1 }, { [id]: 'insert' }, [id]);
      push('link', '链接后继', `执行 s->next = head，新结点指向${ids.length > 1 ? `原首结点 ${oldHead}` : ' NULL'}。`, p,
        { s: v, head: oldHead, 已插入: idx + 1 }, { [id]: 'active' });
      push('head', '更新头指针', `执行 head = s，${v} 成为新的首结点。`, [{ label: 'head', index: 0 }],
        { s: v, head: v, 已插入: idx + 1 }, { [id]: 'found' });
    });

    push('done', '完成', `头插完成：链表顺序为 ${vals.slice().reverse().join(' → ')}，与输入顺序相反。`,
      [{ label: 'head', index: 0 }], { head: vals[vals.length - 1], 已插入: vals.length });
    return steps;
  },
};
