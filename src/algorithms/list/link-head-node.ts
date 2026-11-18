import type { AlgorithmMeta, CodeLine, ListLink, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

const DEFAULT = [10, 20, 30, 40];
const SENTINEL = 'sentinel';

function buildCode(atTail: boolean, sentinel: boolean): AlgorithmMeta['code'] {
  const cpp: CodeLine[] = [
    { text: '#include <iostream>' },
    { text: 'struct LNode { int data; LNode *next; };' },
    { text: 'LNode* CreateList(const int A[], int n) {' },
    { text: sentinel ? '  LNode *head = new LNode{0, nullptr};  // 头结点不存数据' : '  LNode *head = nullptr;', anchor: 'init' },
  ];
  const python: CodeLine[] = [
    { text: 'class Node:' },
    { text: '    def __init__(self, data):' },
    { text: '        self.data = data' },
    { text: '        self.next = None' },
    { text: 'def create_list(A):' },
    { text: sentinel ? '    head = Node(None)  # 头结点不存数据' : '    head = None', anchor: 'init' },
  ];
  if (atTail) {
    cpp.push({ text: '  LNode *tail = head;' });
    python.push({ text: '    tail = head' });
  }
  cpp.push({ text: '  for (int i = 0; i < n; ++i) {' }, { text: '    LNode *s = new LNode{A[i], nullptr};', anchor: 'alloc' });
  python.push({ text: '    for v in A:' }, { text: '        s = Node(v)', anchor: 'alloc' });

  if (atTail) {
    if (!sentinel) {
      cpp.push({ text: '    if (tail == nullptr) head = s;', anchor: 'first' }, { text: '    else tail->next = s;', anchor: 'link' });
      python.push({ text: '        if tail is None:' }, { text: '            head = s', anchor: 'first' }, { text: '        else:' }, { text: '            tail.next = s', anchor: 'link' });
    } else {
      cpp.push({ text: '    tail->next = s;', anchor: 'link' });
      python.push({ text: '        tail.next = s', anchor: 'link' });
    }
    cpp.push({ text: '    tail = s;', anchor: 'tail' });
    python.push({ text: '        tail = s', anchor: 'tail' });
  } else {
    cpp.push(
      { text: sentinel ? '    s->next = head->next;' : '    s->next = head;', anchor: 'link' },
      { text: sentinel ? '    head->next = s;' : '    head = s;', anchor: 'head' },
    );
    python.push(
      { text: sentinel ? '        s.next = head.next' : '        s.next = head', anchor: 'link' },
      { text: sentinel ? '        head.next = s' : '        head = s', anchor: 'head' },
    );
  }

  cpp.push(
    { text: '  }' }, { text: '  return head;', anchor: 'done' }, { text: '}' },
    { text: 'int main() {' },
    { text: '  int A[] = {10, 20, 30, 40};' },
    { text: '  LNode *head = CreateList(A, 4);' },
    { text: `  for (LNode *p = ${sentinel ? 'head->next' : 'head'}; p; p = p->next)` },
    { text: '    std::cout << p->data << " ";' },
    { text: '}' },
  );
  python.push(
    { text: '    return head', anchor: 'done' },
    { text: 'head = create_list([10, 20, 30, 40])' },
    { text: sentinel ? 'p = head.next' : 'p = head' },
    { text: 'while p:' }, { text: '    print(p.data, end=" ")' }, { text: '    p = p.next' },
  );
  return { cpp, python };
}

function createListDemo(slug: string, atTail: boolean, sentinel: boolean): AlgorithmMeta {
  const method = atTail ? '尾插' : '头插';
  const variant = sentinel ? '带头结点' : '无头结点';
  const orderText = atTail ? '保持输入顺序' : '与输入顺序相反';
  return {
    slug,
    title: `单链表${method} · ${variant}`,
    chapter: '第 2 章 线性表',
    category: 'ch2',
    summary: `逐个在${atTail ? '链尾' : '首个数据结点之前'}插入，结果${orderText}。`,
    complexity: { time: 'O(n)', space: 'O(n)', extra: '每个结点插入 O(1)，建表额外空间 O(1)' },
    difficulty: '入门',
    inputHint: `输入 1–8 个整数，观察${variant}的${method}法。`,
    defaultInput: DEFAULT,
    input: { min: -999, max: 999, minLen: 1, maxLen: 8 },
    code: buildCode(atTail, sentinel),
    doc: [
      {
        heading: '空表与头指针',
        body: sentinel
          ? 'head 始终指向一个不存放数据的头结点。空表时 head->next 为 NULL，遍历数据从 head->next 开始。'
          : '空表时 head 为 NULL。插入第一个数据结点后，head 直接指向它，遍历数据从 head 开始。',
      },
      {
        heading: `${method}法的指针更新`,
        body: atTail
          ? `${sentinel ? 'tail 初始指向头结点，所有插入都执行 tail->next = s。' : 'tail 初始为 NULL。第一次插入要先令 head = s，此后通过 tail->next = s 接到链尾。'}每次接好新结点后再令 tail = s，建表结果${orderText}。`
          : `先让 s->next 保存原首结点，再更新 ${sentinel ? 'head->next' : 'head'}。每次都插在旧数据之前，建表结果${orderText}。`,
      },
    ],
    quiz: [
      { q: '依次输入 10、20、30，最终的数据结点顺序是？', options: ['10 → 20 → 30', '30 → 20 → 10', '20 → 10 → 30'], answer: atTail ? 0 : 1, explain: `${method}建表的结果${orderText}。` },
      { q: '空链表初始化后，head 指向什么？', options: ['NULL', '不存数据的头结点', '尾部数据结点'], answer: sentinel ? 1 : 0, explain: sentinel ? '头结点在插入数据前就已经存在。' : '无头结点的空表用 NULL 表示。' },
    ],
    generate: (input) => {
      const values = input.slice(0, 8);
      const steps: TraceStep[] = [];
      const order: string[] = sentinel ? [SENTINEL] : [];
      const data = new Map<string, string | number>();
      const next = new Map<string, string | null>();
      let head: string | null = sentinel ? SENTINEL : null;
      let tail: string | null = atTail ? head : null;
      let inserted = 0;
      if (sentinel) {
        data.set(SENTINEL, '头结点');
        next.set(SENTINEL, null);
      }
      const label = (id: string | null) => id === null ? 'NULL' : data.get(id)!;
      const pointer = (label: string, id: string | null): ScenePointer => ({ label, index: id === null ? null : order.indexOf(id) });
      const push = (anchor: string, phase: string, caption: string, current?: string) => {
        const pointers = [pointer('head', head)];
        if (atTail) pointers.push(pointer('tail', tail));
        if (current !== undefined) pointers.push(pointer('s', current));
        const nodes = order.map((id) => node(id, label(id), id === current ? 'insert' : id === SENTINEL ? 'active' : 'default'));
        const listLinks: ListLink[] = Array.from(next, ([from, to]) => ({ from, to, field: 'next' }));
        steps.push(makeStep(
          steps.length, anchor, phase,
          { ...listScene(nodes, pointers, `${variant} · 数据结点 ${inserted} 个`), listLinks },
          { head: label(head), ...(atTail ? { tail: label(tail) } : {}), ...(current !== undefined ? { s: label(current) } : {}), 已插入: inserted },
          caption,
        ));
      };

      push('init', '初始化', sentinel
        ? `head 指向不存数据的头结点，head->next = NULL。${atTail ? 'tail 也指向头结点。' : ''}`
        : `空表的 head = NULL。${atTail ? 'tail 也为 NULL。' : ''}`);

      values.forEach((value, index) => {
        const id = `n${index}`;
        data.set(id, value);
        next.set(id, null);
        if (atTail) order.push(id);
        else order.splice(sentinel ? 1 : 0, 0, id);
        push('alloc', '申请结点', `申请结点 s，写入 ${value}，初始化 s->next = NULL。`, id);

        if (atTail) {
          inserted++;
          if (tail === null) {
            head = id;
            push('first', '接入首结点', `原链表为空，执行 head = s，让 head 指向 ${value}。`, id);
          } else {
            next.set(tail, id);
            push('link', '接到链尾', `执行 tail->next = s，从${sentinel && tail === SENTINEL ? '头结点' : `原尾结点 ${label(tail)}`}连到 ${value}。`, id);
          }
          tail = id;
          push('tail', '更新尾指针', `执行 tail = s，新尾结点是 ${value}。`, id);
        } else {
          const first = sentinel ? next.get(SENTINEL)! : head;
          next.set(id, first);
          push('link', '链接后继', `执行 s->next = ${sentinel ? 'head->next' : 'head'}，新结点的 next 指向 ${label(first)}。`, id);
          if (sentinel) next.set(SENTINEL, id);
          else head = id;
          inserted++;
          push('head', sentinel ? '更新头结点的 next' : '更新头指针', `执行 ${sentinel ? 'head->next' : 'head'} = s，${value} 成为首个数据结点。`, id);
        }
      });

      const sequence = order.filter((id) => id !== SENTINEL).map(label).join(' → ');
      push('done', '完成', `${method}建表完成：${sequence || '空表'}。${sequence ? `结果${orderText}。` : ''}`);
      return steps;
    },
  };
}

// 保留原来的地址，既有链接和学习进度继续对应无头结点的头插法。
export const linkHeadInsert = createListDemo('list/link-head-node', false, false);
export const linkHeadInsertWithSentinel = createListDemo('list/head-insert-sentinel', false, true);
export const linkTailInsert = createListDemo('list/tail-insert', true, false);
export const linkTailInsertWithSentinel = createListDemo('list/tail-insert-sentinel', true, true);
