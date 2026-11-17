import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

/** 人数与报数上限：保证默认输入生成的步数远小于 300。 */
const MAX_N = 12;
const MAX_M = 9;

export const circularJoseph: AlgorithmMeta = {
  slug: 'list/circular-joseph',
  title: '循环单链表 · 约瑟夫环',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '围着圈报数，报到 m 就出列，看指针绕环走。',
  complexity: { time: 'O(n·m)', space: 'O(n)', extra: '每出列一人要绕环走 m 步' },
  difficulty: '进阶',
  inputHint: '第一个数为人数 n（2–12），第二个数为报到几出列 m（1–9）；编号 1..n，从 1 号开始报数。',
  defaultInput: [7, 3],
  input: {
    min: 1,
    max: 12,
    minLen: 2,
    maxLen: 2,
    check: (v) => {
      if (v[0] < 2 || v[0] > 12) return '人数需在 2 ~ 12 之间';
      if (v[1] < 1 || v[1] > 9) return '报到几出列（m）需在 1 ~ 9 之间';
      return null;
    },
    // 两个字段范围不同（n: 2–12，m: 1–9），通用采样会撞上非法组合，这里分别取值
    random: () => [2 + Math.floor(Math.random() * 11), 1 + Math.floor(Math.random() * 9)],
  },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct Node { int data; Node *next; };' },
      { text: 'void Joseph(int n, int m) {' },
      { text: '  // 建 1..n 的循环单链表，尾结点 next 指回首结点' },
      { text: '  Node *p = head;', anchor: 'init' },
      { text: '  while (p->next != p) {', anchor: 'loop' },
      { text: '    for (int c = 1; c < m; c++)' },
      { text: '      p = p->next;', anchor: 'count' },
      { text: '    Node *q = p->next;', anchor: 'out' },
      { text: '    p->next = q->next;' },
      { text: '    std::cout << q->data << " ";' },
      { text: '    delete q;' },
      { text: '  }' },
      { text: '  std::cout << p->data;', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'class Node:' },
      { text: '    def __init__(self, data):' },
      { text: '        self.data = data' },
      { text: '        self.next = None' },
      { text: 'def joseph(n, m):' },
      { text: '    # 建 1..n 的循环单链表，尾结点 next 指回首结点' },
      { text: '    p = head', anchor: 'init' },
      { text: '    while p.next is not p:', anchor: 'loop' },
      { text: '        for _ in range(m - 1):' },
      { text: '            p = p.next', anchor: 'count' },
      { text: '        q = p.next', anchor: 'out' },
      { text: '        p.next = q.next' },
      { text: '        print(q.data, end=" ")' },
      { text: '    print(p.data)', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把 n 个人用循环单链表串成一个环，尾结点的 next 不是 NULL 而是指回首结点。报数时工作指针沿 next 绕环移动，数到 m 就把该结点摘下：让它的前驱 p 直接指向它的后继，然后从后继继续报 1。',
      points: [
        '循环链表没有 NULL 结尾，遍历的终止条件是回到起点而不是 p == NULL',
        '摘除 q 只需 p->next = q->next，因为 p 就是 q 的前驱',
        '每出列一人，环上少一个结点，报数仍从 1 重新开始',
      ],
    },
    {
      heading: '为什么用循环链表',
      body: '约瑟夫环每轮都要「绕回」开头。用单链表就得在表尾判空并手工跳回表头，用循环链表这一步由 next 自动完成，代码里没有一处边界特判。代价是遍历必须有明确的停止条件，否则会死循环。',
      points: ['只剩下一个结点时 p->next == p，循环自然结束', '也可以用顺序表加一个计数器模拟，但删除元素要移动，复杂度更高', 'n 较大时可以用数学递推 O(n) 直接求解，但看不到出列过程'],
    },
    {
      heading: '易错点',
      body: '最常见的错误是数数起点搞错：报 1 的人就是当前指针所指的人，因此循环只移动 m-1 次，第 m 个人是 p->next。如果移动 m 次，出列者会整体后移一位。摘除结点后忘了 free，或者误把 p 也删掉，都会让环断裂。',
    },
  ],
  quiz: [
    {
      q: '7 个人围成环，从 1 号报数，报到 3 出列，第一个出列的是？',
      options: ['1 号', '2 号', '3 号', '4 号'],
      answer: 2,
      explain: '1 号报 1、2 号报 2、3 号报 3，所以 3 号先出列。',
    },
    {
      q: '报数循环里为什么要移动 m-1 次而不是 m 次？',
      options: ['从当前结点开始就算报 1', '防止指针越界', '链表长度为 m-1', '为了少比较一次'],
      answer: 0,
      explain: 'p 所指的人已经报了 1，再移动 m-1 次后 p->next 正好是第 m 个人。',
    },
    {
      q: '循环单链表的遍历终止条件通常是？',
      options: ['p == NULL', 'p->next == NULL', '回到起始结点', 'p->next == p 只适用于剩一个结点'],
      answer: 2,
      explain: '环上没有 NULL，只能以「绕回起点」作为结束标志。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 2 ? input : [7, 3];
    const n = Math.min(Math.max(Math.trunc(raw[0]) || 7, 2), MAX_N);
    const m = Math.min(Math.max(Math.trunc(raw[1]) || 3, 1), MAX_M);
    const alive = Array.from({ length: n }, (_, i) => i + 1);
    const out: number[] = [];
    let start = 0;
    let round = 1;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      ptrIdx: number | null,
      vars: Record<string, string | number>,
    ) => {
      const pointers: ScenePointer[] = [
        { label: ptrIdx === null ? 'p=NULL' : 'p', index: ptrIdx },
      ];
      const note = `循环单链表：${alive[alive.length - 1]} 号的 next 指回 ${alive[0]} 号 · 还剩 ${alive.length} 人`;
      steps.push(makeStep(
        k++, anchor, phase,
        listScene(alive.map((v) => node(`p${v}`, v, states[`p${v}`] ?? 'default')), pointers, note),
        vars, caption,
      ));
    };

    push('init', '建环', `${n} 个人依次编号 1~${n}，${n} 号的 next 指回 1 号形成环；从 1 号开始报数，报到 ${m} 出列。`, {}, 0, { 轮次: 1, 人数: n, 报数: 0, 出列: '—' });

    while (alive.length > 1) {
      push('loop', `第 ${round} 轮`, `本轮从 ${alive[start]} 号开始报数，环上还剩 ${alive.length} 人。`, { [`p${alive[start]}`]: 'active' }, start, { 轮次: round, 人数: alive.length, 报数: 0, 出列: '—' });

      let idx = start;
      for (let c = 1; c <= m; c++) {
        idx = (start + c - 1) % alive.length;
        push(
          'count',
          `报数 ${c}`,
          `${alive[idx]} 号报 ${c}${c === m ? '，正是要出列的人' : '，指针沿 next 后移一位'}。`,
          { [`p${alive[idx]}`]: c === m ? 'delete' : 'compare' },
          idx,
          { 轮次: round, 人数: alive.length, 报数: c, 出列: '—' },
        );
      }

      const outVal = alive[idx];
      const nextPerson = alive.length > 1 ? alive[(idx + 1) % alive.length] : outVal;
      push(
        'out',
        '出列',
        `${outVal} 号出列：p->next = q->next 把前驱直接连到后继，下一轮从 ${nextPerson} 号重新报 1。`,
        { [`p${outVal}`]: 'delete' },
        idx,
        { 轮次: round, 人数: alive.length, 报数: m, 出列: outVal },
      );
      out.push(outVal);
      alive.splice(idx, 1);
      start = idx % alive.length;
      round += 1;
    }

    push('done', '结束', `只剩 ${alive[0]} 号；完整出列顺序为 ${out.join('、')}、${alive[0]}。`, { [`p${alive[0]}`]: 'found' }, 0, { 轮次: round, 人数: 1, 报数: 0, 出列: '—' });
    return steps;
  },
};
