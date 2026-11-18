import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const binaryInsertSort: AlgorithmMeta = {
  slug: 'sort/binary-insert', title: '折半插入排序', chapter: '第 10 章 内排序', category: 'ch10',
  summary: '在有序区二分定位，再整体后移腾出插入位置。', complexity: { time: 'O(n²)', space: 'O(1)', extra: '比较 O(n log n)，移动仍为 O(n²)' }, difficulty: '进阶',
  inputHint: '输入 2–10 个整数；用折半查找确定插入位置。', defaultInput: [49, 38, 65, 97, 76, 13, 27], input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [{ text: 'void BinaryInsertSort(int A[], int n) {', anchor: 'init' }, { text: '  for (int i = 1; i < n; i++) {', anchor: 'outer' }, { text: '    int x = A[i], low = 0, high = i - 1;', anchor: 'pick' }, { text: '    while (low <= high) {', anchor: 'search' }, { text: '      int mid = (low + high) / 2;', anchor: 'mid' }, { text: '      if (A[mid] > x) high = mid - 1; else low = mid + 1;' }, { text: '    }' }, { text: '    for (int j = i - 1; j >= low; j--) A[j + 1] = A[j];', anchor: 'move' }, { text: '    A[low] = x;', anchor: 'place' }, { text: '  }', anchor: 'done' }, { text: '}' }],
    python: [{ text: 'def binary_insert_sort(a):', anchor: 'init' }, { text: '    for i in range(1, len(a)):', anchor: 'outer' }, { text: '        x, low, high = a[i], 0, i - 1', anchor: 'pick' }, { text: '        while low <= high:', anchor: 'search' }, { text: '            mid = (low + high) // 2', anchor: 'mid' }, { text: '            if a[mid] > x: high = mid - 1' }, { text: '            else: low = mid + 1' }, { text: '        for j in range(i - 1, low - 1, -1): a[j + 1] = a[j]', anchor: 'move' }, { text: '        a[low] = x', anchor: 'place' }, { text: '    return a', anchor: 'done' }],
  },
  doc: [{ heading: '核心思想', body: '先在已排序区用折半查找定位 x 应插入的位置 low，再把 low 到 i-1 的元素整体后移，最后写入 x。它减少比较次数，却不能减少数组元素移动。', points: ['相等元素放在已有元素之后，因此仍稳定', 'low 是最终插入下标', '适合比较代价高、移动代价低的场景'] }],
  quiz: [{ q: '折半插入排序主要减少哪种操作？', options: ['元素移动', '关键字比较', '额外空间', '循环次数'], answer: 1, explain: '二分定位降低比较次数，移动元素数量并未减少。' }],
  generate: (input) => {
    const arr = input.slice(0, 10); const steps: TraceStep[] = []; let id = 0; let comparisons = 0; let writes = 0;
    const push = (anchor: string, phase: string, caption: string, states: Record<number, NodeState> = {}, i = -1, low = -1, high = -1) => {
      steps.push(makeStep(
      id++, anchor, phase,
      arrayScene(arr.map((v, x) => node(`b${x}`, v, states[x] ?? (x < i ? 'sorted' : 'default'))), [
        { label: 'i', index: i < 0 ? null : i }, { label: 'low', index: low < 0 ? null : low }, { label: 'high', index: high < 0 ? null : high },
      ]),
      { i: i < 0 ? '—' : i, low: low < 0 ? '—' : low, high: high < 0 ? '—' : high, 比较次数: comparisons }, caption,
      ));
      steps[steps.length - 1].metrics = { comparisons, swaps: 0, writes };
    };
    push('init', '初始化', 'A[0] 是初始有序区。');
    for (let i = 1; i < arr.length; i++) { const x = arr[i]; let low = 0; let high = i - 1; push('outer', `第 ${i} 趟`, `取出 ${x}，在有序区折半定位。`, { [i]: 'active' }, i, low, high); push('pick', '暂存', `x = ${x}。`, { [i]: 'min' }, i, low, high); while (low <= high) { const mid = Math.floor((low + high) / 2); comparisons++; push('mid', '取中点', `比较 A[${mid}] = ${arr[mid]} 与 ${x}。`, { [mid]: 'compare' }, i, low, high); push('search', '折半定位', arr[mid] > x ? `${arr[mid]} 更大，查左半区。` : `${arr[mid]} 不大于 ${x}，查右半区。`, { [mid]: 'compare' }, i, low, high); if (arr[mid] > x) high = mid - 1; else low = mid + 1; }
      for (let j = i - 1; j >= low; j--) { arr[j + 1] = arr[j]; writes++; push('move', '后移', `A[${j}] 后移到 A[${j + 1}]。`, { [j + 1]: 'insert' }, i, low, high); } arr[low] = x; writes++; push('place', '插入就位', `${x} 写入 A[${low}]。`, { [low]: 'insert' }, i, low, high); }
    push('done', '完成', `排序完成：${arr.join(', ')}。`); return steps;
  },
};
