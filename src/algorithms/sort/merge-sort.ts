import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, auxStruct, makeStep, node } from '../../engine/scene';

export const mergeSort: AlgorithmMeta = {
  slug: 'sort/merge-sort',
  title: '归并排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '先递归二分，再把两段有序序列合并成一段。',
  complexity: { time: 'O(n log n)', space: 'O(n)', extra: '稳定排序；需要辅助数组' },
  difficulty: '进阶',
  inputHint: '输入 2–10 个整数作为待排序序列；观察辅助数组的写入与写回主数组的过程。',
  defaultInput: [49, 38, 65, 97, 76, 13, 27],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: 'void MergeSort(int A[], int l, int r) {', anchor: 'enter' },
      { text: '  if (l >= r) return;', anchor: 'guard' },
      { text: '  int mid = (l + r) / 2;', anchor: 'split' },
      { text: '  MergeSort(A, l, mid);' },
      { text: '  MergeSort(A, mid + 1, r);' },
      { text: '  int B[MAXN];', anchor: 'merge' },
      { text: '  int i = l, j = mid + 1, t = l;' },
      { text: '  while (i <= mid && j <= r) {', anchor: 'cmp' },
      { text: '    if (A[i] <= A[j]) {' },
      { text: '      B[t++] = A[i++];', anchor: 'writeAux' },
      { text: '    } else {' },
      { text: '      B[t++] = A[j++];' },
      { text: '    }' },
      { text: '  }' },
      { text: '  while (i <= mid) B[t++] = A[i++];' },
      { text: '  while (j <= r) B[t++] = A[j++];' },
      { text: '  for (int x = l; x <= r; x++) A[x] = B[x];', anchor: 'copyBack' },
      { text: '}', anchor: 'ret' },
      { text: '// 排序结束', anchor: 'done' },
    ],
    python: [
      { text: 'def merge_sort(A, l, r):', anchor: 'enter' },
      { text: '    if l >= r:', anchor: 'guard' },
      { text: '        return' },
      { text: '    mid = (l + r) // 2', anchor: 'split' },
      { text: '    merge_sort(A, l, mid)' },
      { text: '    merge_sort(A, mid + 1, r)' },
      { text: '    B = A[l:r + 1]  # 辅助数组', anchor: 'merge' },
      { text: '    i, j, t = l, mid + 1, l' },
      { text: '    while i <= mid and j <= r:', anchor: 'cmp' },
      { text: '        if A[i] <= A[j]:' },
      { text: '            B[t - l] = A[i]', anchor: 'writeAux' },
      { text: '            i += 1' },
      { text: '        else:' },
      { text: '            B[t - l] = A[j]' },
      { text: '            j += 1' },
      { text: '        t += 1' },
      { text: '    while i <= mid:' },
      { text: '        B[t - l] = A[i]' },
      { text: '        i += 1' },
      { text: '        t += 1' },
      { text: '    while j <= r:' },
      { text: '        B[t - l] = A[j]' },
      { text: '        j += 1' },
      { text: '        t += 1' },
      { text: '    A[l:r + 1] = B', anchor: 'copyBack' },
      { text: '    # 本层返回', anchor: 'ret' },
      { text: '# 排序完成', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '归并排序是典型的分治法：把序列从中间一分为二，分别递归排序，再把两段有序序列合并成一段有序序列。合并时用两个指针分别指向两段的队首，每次取较小者写入辅助数组，最后把辅助数组整体拷回原数组。',
      points: [
        '划分只是算下标，不做任何搬移，真正的排序发生在合并阶段',
        '递归出口是区间长度小于 2，此时天然有序',
        '合并必须借助 O(n) 的辅助空间，不能原地完成',
      ],
    },
    {
      heading: '为什么稳定',
      body: '合并时用 A[i] <= A[j] 判断，相等时优先取左段元素，左段元素原本就在前面，因此相等关键字的相对次序不会被改变，归并排序是稳定排序。若改成 <，右段的相等元素会被提前取走，稳定性被破坏。',
    },
    {
      heading: '复杂度与对比',
      body: '递归树高 log n，每层合并的总代价 O(n)，因此时间恒为 O(n log n)，与初始序列是否有序无关。空间需要辅助数组与递归栈，共 O(n)。相比快排，它没有最坏退化，但常数更大、空间开销也更大，常用于外部排序与链表排序。',
      points: ['比较次数稳定，适合对时间有严格要求的场景', '自底向上的非递归写法可省掉递归栈', '多路归并是外部排序的基础'],
    },
  ],
  quiz: [
    { q: '归并排序真正完成排序动作发生在哪个阶段？', options: ['划分阶段', '合并阶段', '递归出口', '建堆阶段'], answer: 1, explain: '划分只计算下标，元素的有序化全部由合并完成。' },
    { q: '归并排序的空间复杂度是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 2, explain: '合并需要与原数组等长的辅助数组，另外递归栈是 O(log n)，总体 O(n)。' },
    { q: '合并时写成 A[i] <= A[j] 而非 <，是为了？', options: ['减少比较次数', '保证稳定', '避免越界', '节省空间'], answer: 1, explain: '相等时优先取左段，保持相等元素的原有相对次序。' },
  ],
  generate: (input) => {
    const vals = (input.length >= 2 ? input : [49, 38, 65, 97, 76, 13, 27]).slice(0, 10);
    const n = vals.length;
    const arr = [...vals];
    const ids = arr.map((_, i) => `p${i}`);
    const auxIds = arr.map((_, i) => `a${i}`);
    const auxVal: (number | null)[] = Array(n).fill(null);
    const steps: TraceStep[] = [];
    let k = 0;
    let comparisons = 0;
    let allSorted = false;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState>,
      stack: string[],
      info: { l: number; r: number; mid: number },
    ) => {
      const mainNodes = ids.map((id, i) =>
        node(id, arr[i], states[i] ?? (allSorted ? 'sorted' : 'default')),
      );
      const auxNodes = auxIds.map((id, i) =>
        node(id, auxVal[i] === null ? '' : String(auxVal[i]), auxVal[i] === null ? 'default' : 'insert'),
      );
      const written = auxVal.filter((v) => v !== null).length;
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...arrayScene(mainNodes, [], n, `当前区间 [${info.l}, ${info.r}]`),
            aux: auxStruct('辅助数组', auxNodes),
          },
          {
            当前区间: `[${info.l}, ${info.r}]`,
            左段: info.mid >= 0 ? `[${info.l}, ${info.mid}]` : '—',
            右段: info.mid >= 0 ? `[${info.mid + 1}, ${info.r}]` : '—',
            递归深度: stack.length,
            辅助数组已写: `${written} / ${n}`,
          },
          caption,
          stack.length ? [...stack] : undefined,
        ),
      );
    };

    const ms = (l: number, r: number, stack: string[]): void => {
      stack.push(`Msort(${l}, ${r})`);
      push('enter', '进入区间', `处理区间 [${l}, ${r}]。`, {}, stack, { l, r, mid: -1 });
      if (l >= r) {
        push(
          'guard',
          '递归出口',
          l === r ? `区间只剩 A[${l}] = ${arr[l]}，长度为 1 天然有序，直接返回。` : '区间为空，直接返回。',
          {},
          stack,
          { l, r, mid: -1 },
        );
        stack.pop();
        return;
      }

      const mid = (l + r) >> 1;
      push('split', '二分划分', `取 mid = ${mid}，分成 [${l}, ${mid}] 与 [${mid + 1}, ${r}] 两段，先分别递归排序。`, {}, stack, { l, r, mid });

      ms(l, mid, stack);
      ms(mid + 1, r, stack);

      for (let x = 0; x < n; x++) auxVal[x] = null;
      push('merge', '开始合并', `两段都已有序，用双指针把它们合并到辅助数组的 ${l} ~ ${r} 位置。`, {}, stack, { l, r, mid });

      let i = l;
      let j = mid + 1;
      let t = l;
      while (i <= mid && j <= r) {
        comparisons += 1;
        push(
          'cmp',
          '比较两段队首',
          `比较左段 A[${i}] = ${arr[i]} 与右段 A[${j}] = ${arr[j]}，先写较小者（相等时取左段，保证稳定）。`,
          { [i]: 'compare', [j]: 'compare' },
          stack,
          { l, r, mid },
        );
        if (arr[i] <= arr[j]) {
          const v = arr[i];
          auxVal[t] = v;
          push('writeAux', '写入辅助数组', `左段 ${v} 不大于右段队首，写入辅助数组下标 ${t}，i 右移。`, { [i]: 'insert' }, stack, { l, r, mid });
          i += 1;
        } else {
          const v = arr[j];
          auxVal[t] = v;
          push('writeAux', '写入辅助数组', `右段 ${v} 更小，写入辅助数组下标 ${t}，j 右移。`, { [j]: 'insert' }, stack, { l, r, mid });
          j += 1;
        }
        t += 1;
      }
      while (i <= mid) {
        const v = arr[i];
        auxVal[t] = v;
        push('writeAux', '搬走剩余元素', `右段已取完，把左段剩余的 ${v} 写入辅助数组下标 ${t}。`, { [i]: 'insert' }, stack, { l, r, mid });
        i += 1;
        t += 1;
      }
      while (j <= r) {
        const v = arr[j];
        auxVal[t] = v;
        push('writeAux', '搬走剩余元素', `左段已取完，把右段剩余的 ${v} 写入辅助数组下标 ${t}。`, { [j]: 'insert' }, stack, { l, r, mid });
        j += 1;
        t += 1;
      }

      for (let x = l; x <= r; x++) {
        arr[x] = auxVal[x] as number;
        push('copyBack', '写回主数组', `把辅助数组下标 ${x} 的 ${auxVal[x]} 写回 A[${x}]，区间 [${l}, ${r}] 已有序。`, { [x]: 'insert' }, stack, { l, r, mid });
      }

      stack.pop();
      push('ret', '本层返回', `区间 [${l}, ${r}] 合并完成，返回上一层继续合并。`, {}, stack, { l, r, mid });
    };

    ms(0, n - 1, []);
    allSorted = true;
    push('done', '完成', `排序完成：${arr.join(', ')}。共比较 ${comparisons} 次。`, {}, [], { l: 0, r: n - 1, mid: -1 });
    return steps;
  },
};
