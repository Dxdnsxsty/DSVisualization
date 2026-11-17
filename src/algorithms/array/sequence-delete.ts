import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, cells, makeStep } from '../../engine/scene';

const CAP = 8;
const POS = 2; // 位序 3 → 下标 2

export const sequenceDelete: AlgorithmMeta = {
  slug: 'array/sequence-delete',
  title: '顺序表 · 删除操作',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '删除位序 3 的元素，观察后续元素依次前移。',
  complexity: { time: 'O(n)', space: 'O(1)', extra: '平均移动约 n/2 个元素' },
  difficulty: '入门',
  inputHint: '输入若干整数作为初始顺序表，固定删除位序 3（下标 2）的元素。',
  defaultInput: [20, 60, 30, 10, 40, 50],
  input: { min: -999, max: 999, minLen: 3, maxLen: 8 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'bool ListDelete(int L[], int &length, int pos, int &value) {' },
      { text: '  if (pos < 1 || pos > length) return false;', anchor: 'check' },
      { text: '  value = L[pos - 1];' },
      { text: '  for (int j = pos - 1; j < length - 1; j++)', anchor: 'loopHead' },
      { text: '    L[j] = L[j + 1];', anchor: 'shift' },
      { text: '  length--;', anchor: 'len' },
      { text: '  return true;', anchor: 'done' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  int L[8] = {20, 60, 30, 10, 40, 50}; int length = 6, v;' },
      { text: '  ListDelete(L, length, 3, v);' },
      { text: '  std::cout << "deleted=" << v << std::endl;' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'def list_delete(L, length, pos):' },
      { text: '    if pos < 1 or pos > length: return None', anchor: 'check' },
      { text: '    value = L[pos - 1]' },
      { text: '    for j in range(pos - 1, length - 1):', anchor: 'loopHead' },
      { text: '        L[j] = L[j + 1]', anchor: 'shift' },
      { text: '    length -= 1', anchor: 'len' },
      { text: '    return value', anchor: 'done' },
      { text: 'L = [20, 60, 30, 10, 40, 50]' },
      { text: 'print(list_delete(L, 6, 3), L[:5])' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '删除不需要真的"抹掉"内存，只需取出被删元素的值，然后把它后面的所有元素依次向前挪一格，最后把逻辑表长减一。最后一个格子里的残留值不在表长范围内，视为无效数据。',
      points: ['移动方向必须从前向后，与插入相反', '先取出被删值，再覆盖，顺序不能反', '表长减一后，尾部的旧值不用清理'],
    },
    {
      heading: '为什么不用清空尾部',
      body: '顺序表的有效范围由 length 决定。length 减一之后，下标 length 处的内容已不属于线性表，任何遍历都不会访问到它。',
    },
    {
      heading: '复杂度与易错点',
      body: '删除表头需要移动 n-1 个元素，删除表尾移动 0 个，平均 O(n)，空间 O(1)。',
      points: ['循环上界写成 j < length 会访问越界的 L[length]', '忘记 length-- 会让残留值被当成有效元素输出', '位序与下标混淆会删错元素'],
    },
  ],
  quiz: [
    { q: '顺序表删除时元素移动的方向是？', options: ['从后往前', '从前往后', '两端向中间', '随机'], answer: 1, explain: '删除要把后继元素前移填补空位，必须从前往后依次赋值。' },
    { q: '删除后为什么不必把最后一个格子清零？', options: ['内存自动清零', '因为 length 减一后它已不在有效范围', '编译器会优化', '其实必须清零'], answer: 1, explain: '顺序表的有效范围由 length 界定，尾部残留值不会被访问。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const initial = (input.length >= 3 ? input : [20, 60, 30, 10, 40, 50]).slice(0, CAP);
    const L: (number | null)[] = Array.from({ length: CAP }, () => null);
    initial.forEach((v, i) => { L[i] = v; });
    let len = initial.length;
    const removed = L[POS];
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState> = {},
      labels: Record<number, string> = {},
      extra: Record<string, string | number> = {},
    ) => {
      steps.push(makeStep(
        k++, anchor, phase,
        arrayScene(cells(L, CAP, states, labels), [], CAP, `容量 ${CAP} · 表长 ${len}`),
        { 位序: 3, 下标: POS, 表长: len, 被删值: removed ?? '—', ...extra },
        caption,
      ));
    };

    push('check', '合法性检查', `检查位序 3 是否在 [1, ${len}] 内：合法，取出 L[2] = ${removed}。`, { [POS]: 'delete' }, { [POS]: 'pos' });
    for (let j = POS; j < len - 1; j++) {
      push('loopHead', '元素前移', `准备用 L[${j + 1}] = ${L[j + 1]} 填补 L[${j}]。`, { [j + 1]: 'active' }, { [j]: 'j' }, { j });
      L[j] = L[j + 1];
      push('shift', '元素前移', `执行 L[${j}] = L[${j + 1}]，元素前移一格。`, { [j]: 'insert' }, { [j]: 'j' }, { j });
    }
    L[len - 1] = null;
    len -= 1;
    push('len', '更新表长', `表长由 ${len + 1} 变为 ${len}，尾部残留值已失效。`, { [POS]: 'found' });
    push('done', '完成', `删除结束，共移动 ${initial.length - 1 - POS} 个元素，被删值为 ${removed}。`, { [POS]: 'found' });
    return steps;
  },
};
