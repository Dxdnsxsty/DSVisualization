import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const bubbleSort: AlgorithmMeta = {
  slug: 'sort/bubble-sort',
  title: '冒泡排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '相邻逆序就交换，每趟把最大值浮到区间末尾。',
  complexity: { time: 'O(n²)', space: 'O(1)', extra: '稳定排序；最好情况 O(n)' },
  difficulty: '入门',
  inputHint: '输入 2–10 个整数作为待排序序列；可观察交换次数与提前终止优化。',
  defaultInput: [20, 60, 30, 10, 40],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#include <utility>' },
      { text: 'void BubbleSort(int A[], int n) {' },
      { text: '  for (int i = 0; i < n - 1; i++) {', anchor: 'outer' },
      { text: '    bool swapped = false;' },
      { text: '    for (int j = 0; j < n - 1 - i; j++) {', anchor: 'inner' },
      { text: '      if (A[j] > A[j + 1]) {', anchor: 'cmp' },
      { text: '        std::swap(A[j], A[j + 1]);', anchor: 'swap' },
      { text: '        swapped = true;' },
      { text: '      }' },
      { text: '    }' },
      { text: '    if (!swapped) break;', anchor: 'pass' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def bubble_sort(A):' },
      { text: '    n = len(A)' },
      { text: '    for i in range(n - 1):', anchor: 'outer' },
      { text: '        swapped = False' },
      { text: '        for j in range(n - 1 - i):', anchor: 'inner' },
      { text: '            if A[j] > A[j + 1]:', anchor: 'cmp' },
      { text: '                A[j], A[j + 1] = A[j + 1], A[j]', anchor: 'swap' },
      { text: '                swapped = True' },
      { text: '        if not swapped:', anchor: 'pass' },
      { text: '            break' },
      { text: '    return A', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '从左到右反复比较相邻的两个元素，若前大后小则交换。这样一趟扫描之后，未排序区间里最大的元素一定被推到了区间末尾，就像气泡浮出水面。下一趟只需处理更短的区间。',
      points: ['每趟确定一个最终位置，共需 n-1 趟', '已归位的尾部区间不再参与比较，所以内层上界是 n-1-i', '相等时不交换，因此冒泡排序是稳定的'],
    },
    {
      heading: '提前终止优化',
      body: '如果某一趟全程没有发生交换，说明序列已经整体有序，可以立即结束。加入 swapped 标志后，最好情况（本来就有序）只需一趟扫描，时间复杂度降为 O(n)。',
    },
    {
      heading: '复杂度与易错点',
      body: '最坏与平均 O(n²)，空间 O(1)，稳定。',
      points: ['内层上界写成 n-1 会重复比较已归位元素，虽不影响正确性但浪费', '比较用 > 而非 >=，否则相等元素被交换会破坏稳定性', '交换方向写反会变成降序'],
    },
  ],
  quiz: [
    { q: '冒泡排序第 1 趟结束后，可以确定哪个元素的位置？', options: ['最小值', '最大值', '中位数', '都不能'], answer: 1, explain: '最大的元素会被不断交换到区间末尾，位置最终确定。' },
    { q: '一趟扫描中没有任何交换，说明什么？', options: ['代码有错', '序列已经有序，可提前结束', '需要再扫一趟', '数据全相等'], answer: 1, explain: '没有逆序对即整体有序，swapped 优化可将最好情况降为 O(n)。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const vals = (input.length >= 2 ? input : [20, 60, 30, 10, 40]).slice(0, 10);
    const n = vals.length;
    const order = vals.map((_, i) => `b${i}`); // 元素身份固定，交换时只换位置 → SVG 平移动画
    const value: Record<string, number> = {};
    order.forEach((id, i) => { value[id] = vals[i]; });
    let sortedFrom = n;
    let comparisons = 0;
    let swaps = 0;
    let k = 0;

    const snapshot = (states: Record<string, NodeState>) =>
      arrayScene(
        order.map((id, idx) => node(id, value[id], idx >= sortedFrom ? 'sorted' : (states[id] ?? 'default'))),
        [], n, `未排序区间长度 ${sortedFrom}`,
      );
    const push = (anchor: string, phase: string, caption: string, states: Record<string, NodeState> = {}, extra: Record<string, string | number> = {}) => {
      steps.push(makeStep(k++, anchor, phase, snapshot(states), { 比较次数: comparisons, 交换次数: swaps, ...extra }, caption));
    };

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      push('outer', `第 ${i + 1} 趟`, `第 ${i + 1} 趟开始，未排序区间为下标 0 ~ ${n - 1 - i}。`, {}, { i });
      for (let j = 0; j < n - 1 - i; j++) {
        push('inner', '内层扫描', `j = ${j}，准备比较相邻元素。`, {}, { i, j });
        comparisons += 1;
        const a = value[order[j]];
        const b = value[order[j + 1]];
        push('cmp', '相邻比较', `比较 ${a} 与 ${b}：${a > b ? '逆序，需要交换' : '顺序正确，不交换'}。`,
          { [order[j]]: 'compare', [order[j + 1]]: 'compare' }, { i, j });
        if (a > b) {
          const t = order[j]; order[j] = order[j + 1]; order[j + 1] = t;
          swapped = true;
          swaps += 1;
          push('swap', '交换', `交换 ${a} 与 ${b}，较大元素向右移动一格。`,
            { [order[j]]: 'insert', [order[j + 1]]: 'insert' }, { i, j });
        }
      }
      sortedFrom = n - 1 - i;
      push('pass', '一趟结束', `第 ${i + 1} 趟结束，下标 ${sortedFrom} 的元素已归位。`, {}, { i });
      if (!swapped) {
        push('done', '提前结束', '本趟没有发生交换，说明序列已整体有序，提前结束。', {}, { i });
        return steps;
      }
    }
    sortedFrom = 0;
    push('done', '完成', `排序完成：${order.map((id) => value[id]).join(', ')}。`);
    return steps;
  },
};
