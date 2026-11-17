import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const selectSort: AlgorithmMeta = {
  slug: 'sort/select-sort',
  title: '简单选择排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '每趟选出未排序区间的最小值，交换到区间首位。',
  complexity: { time: 'O(n²)', space: 'O(1)', extra: '不稳定排序；交换最多 n-1 次' },
  difficulty: '入门',
  inputHint: '输入 2–10 个整数作为待排序序列；重点观察 minPos 的更新与每趟仅一次交换。',
  defaultInput: [20, 60, 30, 10, 40],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#include <utility>' },
      { text: 'void SelectSort(int A[], int n) {' },
      { text: '  for (int i = 0; i < n - 1; i++) {', anchor: 'outer' },
      { text: '    int minPos = i;', anchor: 'init' },
      { text: '    for (int j = i + 1; j < n; j++) {', anchor: 'inner' },
      { text: '      if (A[j] < A[minPos])', anchor: 'cmp' },
      { text: '        minPos = j;', anchor: 'update' },
      { text: '    }' },
      { text: '    if (minPos != i)', anchor: 'swap' },
      { text: '      std::swap(A[i], A[minPos]);' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  int A[] = {20, 60, 30, 10, 40};' },
      { text: '  SelectSort(A, 5);' },
      { text: '  for (int v : A) std::cout << v << " ";' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'def select_sort(A):' },
      { text: '    n = len(A)' },
      { text: '    for i in range(n - 1):', anchor: 'outer' },
      { text: '        min_pos = i', anchor: 'init' },
      { text: '        for j in range(i + 1, n):', anchor: 'inner' },
      { text: '            if A[j] < A[min_pos]:', anchor: 'cmp' },
      { text: '                min_pos = j', anchor: 'update' },
      { text: '        if min_pos != i:', anchor: 'swap' },
      { text: '            A[i], A[min_pos] = A[min_pos], A[i]' },
      { text: '    return A', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把序列分成「已排序」和「未排序」两段。每一趟从未排序区间中线性扫描找出最小元素的下标 minPos，再与区间第一个元素交换。这样每趟只交换一次，就把一个最小元素固定到前面。',
      points: ['minPos 记录的是下标，不是元素值', '内层循环只更新 minPos，不立即交换', '每趟最多一次交换，共 n-1 趟'],
    },
    {
      heading: '为什么不稳定',
      body: '交换是跨距离进行的。例如序列 [2, 2, 1]，第一趟把 1 与首个 2 交换，两个 2 的相对次序就被改变了，因此简单选择排序是不稳定排序。',
    },
    {
      heading: '复杂度与对比',
      body: '无论输入是否有序，比较次数恒为 n(n-1)/2，时间 O(n²)，空间 O(1)。相比冒泡排序，它的交换次数少得多（最多 n-1 次），在「写内存代价高」的场景更划算。',
      points: ['比较次数与初始顺序无关，没有最好情况优化', '内层 j 从 i+1 开始，别把已归位元素再扫一遍', '判断 minPos != i 可避免无意义的自交换'],
    },
  ],
  quiz: [
    { q: '对 n 个元素做简单选择排序，最多发生多少次交换？', options: ['n(n-1)/2 次', 'n-1 次', 'n 次', '0 次'], answer: 1, explain: '每趟最多交换一次，共 n-1 趟，所以最多 n-1 次。' },
    { q: '简单选择排序的比较次数是否受初始有序程度影响？', options: ['有序时更少', '有序时更多', '不受影响，恒为 n(n-1)/2', '取决于实现'], answer: 2, explain: '每趟都要完整扫描未排序区间找最小值，比较次数固定。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const vals = (input.length >= 2 ? input : [20, 60, 30, 10, 40]).slice(0, 10);
    const n = vals.length;
    const order = vals.map((_, i) => `e${i}`);
    const value: Record<string, number> = {};
    order.forEach((id, i) => { value[id] = vals[i]; });
    let sortedUpto = 0;
    let comparisons = 0;
    let swaps = 0;
    let k = 0;

    const snapshot = (states: Record<string, NodeState>) =>
      arrayScene(
        order.map((id, idx) => node(id, value[id], idx < sortedUpto ? 'sorted' : (states[id] ?? 'default'))),
        [], n, `已归位 ${sortedUpto} 个`,
      );
    const push = (anchor: string, phase: string, caption: string, states: Record<string, NodeState> = {}, extra: Record<string, string | number> = {}) => {
      steps.push(makeStep(k++, anchor, phase, snapshot(states), { 比较次数: comparisons, 交换次数: swaps, ...extra }, caption));
    };

    for (let i = 0; i < n - 1; i++) {
      push('outer', `第 ${i + 1} 趟`, `第 ${i + 1} 趟开始，未排序区间为下标 ${i} ~ ${n - 1}。`, {}, { i });
      let minPos = i;
      push('init', '假设最小值', `先假设 A[${i}] = ${value[order[i]]} 最小，令 minPos = ${i}。`, { [order[i]]: 'min' }, { i, minPos });
      for (let j = i + 1; j < n; j++) {
        push('inner', '内层扫描', `j = ${j}，取出 A[${j}] = ${value[order[j]]} 准备比较。`, { [order[minPos]]: 'min' }, { i, j, minPos });
        comparisons += 1;
        const cur = value[order[j]];
        const best = value[order[minPos]];
        push('cmp', '比较', `比较 A[${j}] = ${cur} 与 A[minPos] = ${best}：${cur < best ? '更小' : '不小于'}。`,
          { [order[j]]: 'compare', [order[minPos]]: 'min' }, { i, j, minPos });
        if (cur < best) {
          minPos = j;
          push('update', '更新 minPos', `发现更小值，更新 minPos = ${j}。`, { [order[minPos]]: 'min' }, { i, j, minPos });
        }
      }
      if (minPos !== i) {
        const a = value[order[i]];
        const b = value[order[minPos]];
        const t = order[i]; order[i] = order[minPos]; order[minPos] = t;
        swaps += 1;
        push('swap', '交换', `交换 A[${i}] = ${a} 与 A[${minPos}] = ${b}，最小值归位。`,
          { [order[i]]: 'insert', [order[minPos]]: 'insert' }, { i, minPos });
      } else {
        push('swap', '无需交换', `minPos 仍等于 i，本趟无需交换。`, { [order[i]]: 'found' }, { i, minPos });
      }
      sortedUpto = i + 1;
    }
    sortedUpto = n;
    push('done', '完成', `排序完成：${order.map((id) => value[id]).join(', ')}。`);
    return steps;
  },
};
