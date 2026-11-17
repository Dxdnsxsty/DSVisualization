import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

export const linkSearch: AlgorithmMeta = {
  slug: 'list/link-search',
  title: '单链表 · 按值查找',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '沿 next 指针逐个比较，观察 p 的移动与终止条件。',
  complexity: { time: 'O(n)', space: 'O(1)', extra: '链式存储不支持随机访问' },
  difficulty: '入门',
  inputHint: '输入若干整数：最后一个数是查找目标，其余是链表各结点的值。',
  defaultInput: [10, 20, 30, 40, 30],
  input: { min: -999, max: 999, minLen: 2, maxLen: 9 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct LNode { int data; LNode *next; };' },
      { text: 'LNode* Locate(LNode *head, int target) {' },
      { text: '  LNode *p = head;', anchor: 'init' },
      { text: '  while (p != NULL) {', anchor: 'loop' },
      { text: '    if (p->data == target)', anchor: 'cmp' },
      { text: '      return p;', anchor: 'found' },
      { text: '    p = p->next;', anchor: 'move' },
      { text: '  }' },
      { text: '  return NULL;', anchor: 'notfound' },
      { text: '}' },
    ],
    python: [
      { text: 'def locate(head, target):' },
      { text: '    p = head', anchor: 'init' },
      { text: '    while p is not None:', anchor: 'loop' },
      { text: '        if p.data == target:', anchor: 'cmp' },
      { text: '            return p', anchor: 'found' },
      { text: '        p = p.next', anchor: 'move' },
      { text: '    return None', anchor: 'notfound' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '链表结点在内存中不连续，无法像数组那样用下标直接定位，只能从头指针出发，借助工作指针 p 沿 next 逐个后移并比较。习惯上不直接移动 head，避免丢失链表入口。',
      points: ['循环条件 p != NULL 而不是 p->next != NULL，否则会漏掉最后一个结点', '先判空再取 p->data，顺序反了会空指针异常', '查找成功返回结点指针，失败返回 NULL'],
    },
    {
      heading: '与顺序查找的对比',
      body: '顺序表按值查找也是 O(n)，但支持按下标随机访问；链表只能顺序扫描。两者时间复杂度相同，差别在访问方式与内存局部性。',
    },
    {
      heading: '易错点',
      body: '常见的错误是把 while 条件写成 p->next != NULL，这样最后一个结点永远不会被比较；另一种是把 head 本身当作工作指针移动，导致查找结束后再也找不到链表。',
    },
  ],
  quiz: [
    { q: '链表按值查找的循环条件应该是？', options: ['p != NULL', 'p->next != NULL', 'p->data != target', 'i < length'], answer: 0, explain: '必须判断当前结点是否为空；用 p->next 会漏掉最后一个结点。' },
    { q: '查找过程中为什么用工作指针 p 而不直接移动 head？', options: ['head 不能被修改', '移动 head 会丢失链表入口', 'p 更快', '没有区别'], answer: 1, explain: 'head 是链表唯一入口，移动后就无法重新遍历整条链。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 2 ? input : [10, 20, 30, 40, 30];
    const target = raw[raw.length - 1];
    const vals = raw.slice(0, -1).slice(0, 8);
    const ids = vals.map((_, i) => `s${i}`);
    let k = 0;
    let comparisons = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      pIndex: number | null,
    ) => {
      const pointers: ScenePointer[] = [{ label: pIndex === null ? 'p=NULL' : 'p', index: pIndex }];
      steps.push(makeStep(
        k++, anchor, phase,
        listScene(ids.map((id, i) => node(id, vals[i], states[id] ?? 'default')), pointers, `目标值 ${target}`),
        { 目标值: target, 比较次数: comparisons, p: pIndex === null ? 'NULL' : vals[pIndex] },
        caption,
      ));
    };

    push('init', '初始化', `工作指针 p 指向首结点 ${vals[0]}，开始按值查找 ${target}。`, {}, 0);
    for (let p = 0; p < vals.length; p++) {
      push('loop', '检查链尾', `p 不为 NULL，当前位于第 ${p + 1} 个结点（值 ${vals[p]}）。`, { [ids[p]]: 'active' }, p);
      comparisons += 1;
      push('cmp', '比较数据域', `比较 p->data = ${vals[p]} 与目标值 ${target}：${vals[p] === target ? '相等' : '不相等'}。`, { [ids[p]]: 'compare' }, p);
      if (vals[p] === target) {
        push('found', '查找成功', `命中！返回第 ${p + 1} 个结点的地址，共比较 ${comparisons} 次。`, { [ids[p]]: 'found' }, p);
        return steps;
      }
      push('move', '指针后移', `未命中，执行 p = p->next，工作指针移到${p + 1 < vals.length ? `值 ${vals[p + 1]}` : ' NULL'}。`, { [ids[p]]: 'visited' }, p + 1 < vals.length ? p + 1 : null);
    }
    push('notfound', '查找失败', `p 到达 NULL，链表中不存在 ${target}，共比较 ${comparisons} 次。`, {}, null);
    return steps;
  },
};
