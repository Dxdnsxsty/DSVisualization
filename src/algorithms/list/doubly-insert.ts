import type { AlgorithmMeta, ListLink, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

/** 链表最多演示 6 个数据结点，保证每一步都能看清指针走向。 */
const MAXLEN = 6;

export const doublyInsert: AlgorithmMeta = {
  slug: 'list/doubly-insert',
  title: '双链表 · 按位插入',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '先接新结点两条链，再改邻居，四条指针不乱序。',
  complexity: { time: 'O(n)', space: 'O(1)', extra: '查找第 i-1 个结点 O(n)，改指针 O(1)' },
  difficulty: '进阶',
  inputHint: '前若干个数是链表元素，倒数第二个数为插入位置 i，最后一个数为插入值 x（i 从 1 开始）。',
  defaultInput: [10, 20, 30, 40, 3, 25],
  input: { min: -999, max: 999, minLen: 3, maxLen: 8 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct DNode { int data; DNode *prior, *next; };' },
      { text: 'bool InsertDLink(DNode *head, int i, int x) {' },
      { text: '  DNode *p = head;', anchor: 'init' },
      { text: '  int j = 0;' },
      { text: '  while (p != NULL && j < i - 1) {', anchor: 'loop' },
      { text: '    p = p->next;', anchor: 'move' },
      { text: '    j++;' },
      { text: '  }' },
      { text: '  if (p == NULL) return false;' },
      { text: '  DNode *s = new DNode;', anchor: 'alloc' },
      { text: '  s->data = x;' },
      { text: '  s->prior = p;', anchor: 'prior' },
      { text: '  s->next = p->next;', anchor: 'next' },
      { text: '  if (p->next != NULL) p->next->prior = s;', anchor: 'neig' },
      { text: '  p->next = s;', anchor: 'link' },
      { text: '  return true;', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'class DNode:' },
      { text: '    def __init__(self, data):' },
      { text: '        self.data = data' },
      { text: '        self.prior = None' },
      { text: '        self.next = None' },
      { text: 'def insert_dlink(head, i, x):' },
      { text: '    p = head', anchor: 'init' },
      { text: '    j = 0' },
      { text: '    while p is not None and j < i - 1:', anchor: 'loop' },
      { text: '        p = p.next', anchor: 'move' },
      { text: '        j += 1' },
      { text: '    if p is None:' },
      { text: '        return False' },
      { text: '    s = DNode(x)', anchor: 'alloc' },
      { text: '    s.prior = p', anchor: 'prior' },
      { text: '    s.next = p.next', anchor: 'next' },
      { text: '    if p.next is not None:' },
      { text: '        p.next.prior = s', anchor: 'neig' },
      { text: '    p.next = s', anchor: 'link' },
      { text: '    return True', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '双链表每个结点有 prior 与 next 两条链，插入时要同时维护四条指针。第一步始终是找前驱：用 p 从头结点出发走 i-1 步，停在插入位置的前一个结点上，再把新结点 s 接到 p 的后面。',
      points: [
        '先让 s->prior = p、s->next = p->next，把新结点自己的两条链接好',
        '再让 p->next->prior = s，改后继的回指',
        '最后才执行 p->next = s，把前驱的 next 交给新结点',
      ],
    },
    {
      heading: '四条指针的顺序为什么不能乱',
      body: '后两句的顺序是死规定：p->next->prior = s 必须在 p->next = s 之前。一旦先把 p->next 改成 s，原来的后继就再也找不到，第三句会变成 s->prior = s 的自环；反过来若先写 s->next = p->next 又先改 p->next，s->next 就会指向自己，后半条链全部丢失。',
      points: ['前两句可以互换，它们只动新结点自己的域', '后两句必须先改后继、再改前驱', '尾结点插入时 p->next == NULL，第三句要判空跳过'],
    },
    {
      heading: '与单链表插入的对比',
      body: '单链表插入只需两次指针赋值，双链表要四次，换来的好处是可以 O(1) 找到前驱。若已知 p 是第 i 个结点，双链表能在 p 之前插入，单链表只能插在 p 之后，这正是不带头结点双链表少一个「找前驱」循环的原因。',
      points: ['查找前驱仍是 O(n)，改指针才是 O(1)', '删除同理：改邻居两条链，再释放结点', '判空条件仍是 p != NULL，不能省'],
    },
  ],
  quiz: [
    {
      q: '在 p 之后插入 s，四条指针的正确顺序是？',
      options: [
        'p->next = s; s->prior = p; s->next = p->next; p->next->prior = s',
        's->prior = p; s->next = p->next; p->next->prior = s; p->next = s',
        's->next = p->next; p->next = s; s->prior = p; p->next->prior = s',
        'p->next->prior = s; s->prior = p; p->next = s; s->next = p->next',
      ],
      answer: 1,
      explain: '先接新结点的两条链，再改后继的回指，最后把前驱的 next 指向新结点。',
    },
    {
      q: '若先执行 p->next = s，再执行 s->next = p->next，s->next 会指向？',
      options: ['原来的后继', 'NULL', 's 自己', 'p'],
      answer: 2,
      explain: '此时 p->next 已经是 s，所以 s->next 得到 s，形成自环，后半条链丢失。',
    },
    {
      q: 'p 是双链表尾结点时，插入新结点需要执行几条指针赋值？',
      options: ['4 条', '3 条（跳过 p->next->prior）', '2 条', '1 条'],
      answer: 1,
      explain: '尾结点的 next 为 NULL，没有后继可以改回指，因此只需 s->prior、s->next、p->next 三条。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 3 ? input : [10, 20, 30, 40, 3, 25];
    const data = raw.slice(0, -2).slice(0, MAXLEN).map((v) => Math.trunc(v));
    const list = data.length > 0 ? data : [10, 20, 30, 40];
    const want = Math.trunc(raw[raw.length - 2]);
    const wantedItem = Math.trunc(raw[raw.length - 1]);
    const pos = Math.min(Math.max(Number.isFinite(want) ? want : 1, 1), list.length + 1);
    const x = Number.isFinite(wantedItem) ? wantedItem : 25;

    const value: Record<string, string | number> = { h: 'head' };
    list.forEach((v, idx) => {
      value[`n${idx}`] = v;
    });
    value['s'] = x;

    let order = ['h', ...list.map((_, idx) => `n${idx}`)];
    const next = new Map<string, string | null>();
    const prior = new Map<string, string | null>();
    order.forEach((id, index) => {
      next.set(id, order[index + 1] ?? null);
      prior.set(id, order[index - 1] ?? null);
    });
    let pIdx = 0;
    let j = 0;
    let sIdx: number | null = null;
    let k = 0;

    const snap = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      note: string,
    ) => {
      const pointers: ScenePointer[] = [{ label: 'p', index: pIdx }];
      if (sIdx !== null) pointers.push({ label: 's', index: sIdx });
      const nodes = order.map((id, idx) =>
        node(id, value[id], states[id] ?? 'default', undefined, id === 'h' ? undefined : String(idx)),
      );
      const listLinks: ListLink[] = [
        ...Array.from(next, ([from, to]) => ({ from, to, field: 'next' as const })),
        ...Array.from(prior, ([from, to]) => ({ from, to, field: 'prior' as const })),
      ];
      steps.push(makeStep(
        k++, anchor, phase,
        { ...listScene(nodes, pointers, note), listLinks },
        { i: pos, x, j, p: value[order[pIdx]] },
        caption,
      ));
    };

    snap('init', '初始化', `p 指向头结点，j = 0；准备把 ${x} 插到第 ${pos} 个位置。`, { h: 'active' }, `带头结点双链表，共 ${list.length} 个数据结点`);

    while (j < pos - 1) {
      snap('loop', '查找前驱', `j = ${j} < i-1 = ${pos - 1}，p 还没到前驱位置，继续后移。`, { [order[pIdx]]: 'active' }, `循环条件 j < i-1`);
      pIdx += 1;
      j += 1;
      snap('move', '指针后移', `执行 p = p->next，j = ${j}，p 指向第 ${j} 个结点（值 ${value[order[pIdx]]}）。`, { [order[pIdx]]: 'active' }, `已移动 ${j} / ${pos - 1} 次`);
    }

    snap('loop', '循环结束', `j = ${pos - 1}，不再满足 j < i-1；p 停在${pIdx === 0 ? '头结点上，说明新结点将插在第一个数据结点之前' : `第 ${pos - 1} 个结点（值 ${value[order[pIdx]]}），它就是插入位置的前驱`}。`, { [order[pIdx]]: 'found' }, 'p 即第 i-1 个结点');

    const predecessor = order[pIdx];
    const nextId = next.get(predecessor) ?? null;
    sIdx = pIdx + 1;
    order = [...order.slice(0, sIdx), 's', ...order.slice(sIdx)];

    snap('alloc', '申请结点', `申请新结点 s，data 写入 ${x}，暂未接入原链表。`, { s: 'insert', [predecessor]: 'active' }, 's 尚未接入');

    prior.set('s', predecessor);
    snap('prior', '第 1 条：接前驱', `s->prior = p，新结点的 prior 指向前驱 ${value[predecessor]}。`, { s: 'insert', [predecessor]: 'active' }, '只改 s 自己的 prior 域');

    next.set('s', nextId);
    snap('next', '第 2 条：接后继', `s->next = p->next，新结点的 next 指向 ${nextId === null ? 'NULL（p 是尾结点）' : `原后继 ${value[nextId]}`}。`, { s: 'insert', [predecessor]: 'active' }, 's 已设置自己的 prior 和 next');

    if (nextId !== null) {
      prior.set(nextId, 's');
      snap('neig', '第 3 条：改后继回指', `p->next->prior = s，原后继 ${value[nextId]} 的 prior 改指新结点。这一步必须赶在 p->next = s 之前，否则会写成 s->prior = s。`, { s: 'insert', [nextId]: 'compare', [predecessor]: 'active' }, '先改后继，再改前驱的 next');
    } else {
      snap('neig', '尾结点跳过第三步', `p 是尾结点，p->next == NULL，没有后继需要改回指。`, { s: 'insert', [predecessor]: 'active' }, 'p->next == NULL，第三句不执行');
    }

    next.set(predecessor, 's');
    snap('link', '第 4 条：前驱指向新结点', `p->next = s，前驱 ${value[predecessor]} 的 next 指向新结点，链表长度变为 ${order.length - 1}。`, { s: 'found', [predecessor]: 'active' }, 'p->next = s 必须最后执行');

    const seq = order.filter((id) => id !== 'h').map((id) => value[id]).join(' → ');
    snap('done', '完成', `插入完成：${seq}，新结点位于第 ${pos} 个位置。`, {}, `共 ${order.length - 1} 个数据结点`);
    return steps;
  },
};
