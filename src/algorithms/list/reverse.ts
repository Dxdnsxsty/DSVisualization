import type { AlgorithmMeta, ListLink, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

export const listReverse: AlgorithmMeta = {
  slug: 'list/reverse', title: '单链表 · 就地逆置', chapter: '第 2 章 线性表', category: 'ch2', summary: '逐个摘下原链表结点，头插到新链表。', complexity: { time: 'O(n)', space: 'O(1)' }, difficulty: '进阶', inputHint: '输入 2–8 个整数作为链表结点，观察 next 指针反转。', defaultInput: [10, 20, 30, 40], input: { min: -999, max: 999, minLen: 2, maxLen: 8 },
  code: { cpp: [{ text: 'Node* Reverse(Node* head) {', anchor: 'init' }, { text: '  Node *pre = NULL, *p = head;', anchor: 'init' }, { text: '  while (p) {', anchor: 'loop' }, { text: '    Node* q = p->next;', anchor: 'save' }, { text: '    p->next = pre;', anchor: 'link' }, { text: '    pre = p; p = q;', anchor: 'move' }, { text: '  }' }, { text: '  return pre;', anchor: 'done' }, { text: '}' }], python: [{ text: 'def reverse(head):', anchor: 'init' }, { text: '    pre, p = None, head', anchor: 'init' }, { text: '    while p:', anchor: 'loop' }, { text: '        q = p.next', anchor: 'save' }, { text: '        p.next = pre', anchor: 'link' }, { text: '        pre, p = p, q', anchor: 'move' }, { text: '    return pre', anchor: 'done' }] },
  doc: [{ heading: '核心思想', body: '每轮先保存 p 的后继 q，再让 p 指向已逆置部分 pre，最后两个工作指针同时前进。保存 q 是避免断链的关键。', points: ['先保存后继，再改 next', 'pre 始终是新链表表头', '每个结点只处理一次'] }], quiz: [{ q: '逆置时最先要保存什么？', options: ['p 的后继', '尾结点', '长度', '头结点值'], answer: 0, explain: '改写 p->next 前必须保存原后继，否则剩余链表会丢失。' }],
  generate: (input) => {
    const indices = input.map((_, index) => index);
    const next = indices.map<number | null>((index) => index + 1 < indices.length ? index + 1 : null);
    const reversed: number[] = [];
    const steps: TraceStep[] = [];
    let pre: number | null = null;
    let p: number | null = indices[0] ?? null;
    const label = (index: number | null) => index === null ? 'NULL' : input[index];
    const nodeId = (index: number) => `r${index}`;

    const push = (anchor: string, phase: string, caption: string, q?: number | null) => {
      const order = [...reversed, ...indices.slice(reversed.length)];
      const nodes = order.map((index, position) => node(
        nodeId(index), input[index], index === p ? 'active' : position < reversed.length ? 'sorted' : 'default',
      ));
      const indexOf = (index: number | null) => index === null ? null : order.indexOf(index);
      const pointers: ScenePointer[] = [{ label: 'pre', index: indexOf(pre) }, { label: 'p', index: indexOf(p) }];
      if (q !== undefined) pointers.push({ label: 'q', index: indexOf(q) });
      const listLinks: ListLink[] = next.map((to, from) => ({ from: nodeId(from), to: to === null ? null : nodeId(to), field: 'next' }));
      steps.push(makeStep(
        steps.length, anchor, phase,
        { ...listScene(nodes, pointers, `已反转 ${reversed.length} 个结点的 next`), listLinks },
        { pre: label(pre), p: label(p), ...(q !== undefined ? { q: label(q) } : {}) },
        caption,
      ));
    };

    push('init', '初始化', 'pre = NULL，p 指向原链表首结点。');
    while (p !== null) {
      const current: number = p;
      push('loop', '处理当前结点', `p 指向 ${input[current]}，准备把它接到已逆置部分。`);
      const q: number | null = next[current];
      push('save', '保存后继', `保存 q = p->next，q 指向 ${label(q)}。`, q);
      next[current] = pre;
      reversed.unshift(current);
      push('link', '反转指针', `p->next 改为指向 ${label(pre)}，p 和 pre 暂时保持原值。`, q);
      pre = current;
      p = q;
      push('move', '移动指针', `pre 移到新表头 ${label(pre)}，p 移到原后继 ${label(p)}。`, q);
    }
    push('done', '完成', `逆置完成：${reversed.map((index) => input[index]).join(' → ')}。`);
    return steps;
  },
};
