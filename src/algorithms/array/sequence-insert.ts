import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, cells, makeStep } from '../../engine/scene';

const CAP = 8;
const POS = 2; // 位序 3 → 下标 2

export const sequenceInsert: AlgorithmMeta = {
  slug: 'array/sequence-insert',
  title: '顺序表 · 插入操作',
  chapter: '第 2 章 线性表',
  category: 'ch2',
  summary: '在位序 3 插入元素，观察后续元素依次后移。',
  complexity: { time: 'O(n)', space: 'O(1)', extra: '平均移动约 n/2 个元素' },
  difficulty: '入门',
  inputHint: '输入若干整数：最后一个数是要插入的值，其余是初始顺序表；固定插入到位序 3（下标 2）。',
  defaultInput: [20, 60, 30, 10, 40, 99],
  input: { min: -999, max: 999, minLen: 2, maxLen: 8 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define MAX 8' },
      { text: 'bool ListInsert(int L[], int &length, int pos, int value) {' },
      { text: '  if (pos < 1 || pos > length + 1) return false;', anchor: 'check' },
      { text: '  if (length >= MAX) return false;', anchor: 'full' },
      { text: '  for (int j = length - 1; j >= pos - 1; j--)', anchor: 'shiftHead' },
      { text: '    L[j + 1] = L[j];', anchor: 'shift' },
      { text: '  L[pos - 1] = value;', anchor: 'assign' },
      { text: '  length++;', anchor: 'len' },
      { text: '  return true;', anchor: 'done' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  int L[MAX] = {20, 60, 30, 10, 40}; int length = 5;' },
      { text: '  ListInsert(L, length, 3, 99);' },
      { text: '  for (int i = 0; i < length; i++) std::cout << L[i] << " ";' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'MAX = 8' },
      { text: 'def list_insert(L, length, pos, value):' },
      { text: '    if pos < 1 or pos > length + 1: return False', anchor: 'check' },
      { text: '    if length >= MAX: return False', anchor: 'full' },
      { text: '    for j in range(length - 1, pos - 2, -1):', anchor: 'shiftHead' },
      { text: '        L[j + 1] = L[j]', anchor: 'shift' },
      { text: '    L[pos - 1] = value', anchor: 'assign' },
      { text: '    length += 1', anchor: 'len' },
      { text: '    return True', anchor: 'done' },
      { text: 'L = [20, 60, 30, 10, 40] + [0] * 3' },
      { text: 'list_insert(L, 5, 3, 99)' },
      { text: 'print(L[:6])' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '顺序表用一段连续内存存数据，"插入"不是把新值塞进空隙，而是必须先给目标位置腾出空位：从最后一个元素开始，依次把每个元素向后挪一格，最后再写入新值并让表长加一。',
      points: ['必须先检查位序合法（1 ≤ pos ≤ length+1）与容量充足', '移动方向必须从后往前，否则会覆盖尚未搬走的元素', '表长 length 是逻辑长度，MAX 是物理容量，两者不是一回事'],
    },
    {
      heading: '为什么从后往前',
      body: '若从前往后移动，L[pos+1] = L[pos] 会把原值覆盖，之后就再也拿不到它了。倒序移动保证每次读取的都是原始值。',
    },
    {
      heading: '复杂度与易错点',
      body: '最好情况插在表尾 O(1)，最坏插在表头 O(n)，平均约移动 n/2 次，时间复杂度 O(n)，空间 O(1)。',
      points: ['位序（从 1 开始）与下标（从 0 开始）差 1，是最常见的错误来源', '循环终止条件写成 j >= pos 会少移一个元素', '忘记 length++ 会让新元素"看不见"'],
    },
  ],
  quiz: [
    { q: '在长度为 n 的顺序表第 1 个位置插入元素，需要移动多少个元素？', options: ['0 个', '1 个', 'n 个', 'n/2 个'], answer: 2, explain: '表头插入时，原有的 n 个元素都要向后移动一格，共 n 次。' },
    { q: '为什么必须从最后一个元素开始后移？', options: ['为了更快', '避免覆盖尚未搬走的元素', '因为数组下标从 0 开始', '没有理由，习惯而已'], answer: 1, explain: '从前往后会把后面的原始值覆盖掉，导致后续移动读到错误数据。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 2 ? input : [20, 60, 30, 10, 40, 99];
    const value = raw[raw.length - 1];
    const initial = raw.slice(0, -1).slice(0, CAP - 1);
    const L: (number | null)[] = Array.from({ length: CAP }, () => null);
    initial.forEach((v, i) => { L[i] = v; });
    let len = initial.length;
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
        { 位序: 3, 下标: POS, 表长: len, 插入值: value, ...extra },
        caption,
      ));
    };

    push('check', '合法性检查', `检查位序 3 是否落在 [1, ${len + 1}] 内：合法，允许插入。`, { [POS]: 'compare' }, { [POS]: 'pos' });
    push('full', '容量检查', `表长 ${len} < 容量 ${CAP}，仍有空闲格子。`, {}, {}, {});
    for (let j = len - 1; j >= POS; j--) {
      push('shiftHead', '元素后移', `从最后一个元素 L[${j}] = ${initial[j]} 开始倒序搬移。`, { [j]: 'active' }, { [j]: 'j' }, { j });
      L[j + 1] = L[j];
      L[j] = null;
      push('shift', '元素后移', `执行 L[${j + 1}] = L[${j}]，元素 ${initial[j]} 后移一格。`, { [j + 1]: 'insert' }, { [j + 1]: 'j+1' }, { j });
    }
    L[POS] = value;
    push('assign', '写入新值', `空出的下标 ${POS} 写入新值 ${value}。`, { [POS]: 'insert' }, { [POS]: 'pos' });
    len += 1;
    push('len', '更新表长', `表长由 ${len - 1} 变为 ${len}，新元素正式生效。`, { [POS]: 'found' });
    push('done', '完成', `插入结束，共移动 ${initial.length - POS} 个元素。`, { [POS]: 'found' });
    return steps;
  },
};
