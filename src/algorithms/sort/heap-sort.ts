import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

/** 堆排序：先建大根堆，再反复把堆顶换到末尾并向下调整。 */
export const heapSort: AlgorithmMeta = {
  slug: 'sort/heap-sort',
  title: '堆排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '建大根堆，反复取堆顶换到末尾。',
  complexity: { time: 'O(n log n)', space: 'O(1)', extra: '不稳定排序' },
  difficulty: '进阶',
  inputHint: '输入 4–10 个整数，按大根堆做升序排序。',
  defaultInput: [49, 38, 65, 97, 76, 13, 27],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: 'void SiftDown(int a[], int k, int n) {' },
      { text: '  int i = k, j = 2 * i + 1;' },
      { text: '  while (j < n) {' },
      { text: '    if (j + 1 < n && a[j] < a[j + 1]) j++;', anchor: 'pickchild' },
      { text: '    if (a[i] >= a[j]) break;', anchor: 'cmp' },
      { text: '    swap(a[i], a[j]);', anchor: 'swap' },
      { text: '    i = j; j = 2 * i + 1;', anchor: 'down' },
      { text: '  }' },
      { text: '}' },
      { text: 'void HeapSort(int a[], int n) {' },
      { text: '  for (int k = n / 2 - 1; k >= 0; k--) SiftDown(a, k, n);', anchor: 'build' },
      { text: '  for (int end = n - 1; end > 0; end--) {' },
      { text: '    swap(a[0], a[end]);', anchor: 'extract' },
      { text: '    SiftDown(a, 0, end);', anchor: 'resort' },
      { text: '  }' },
      { text: '}', anchor: 'done' },
    ],
    python: [
      { text: 'def sift_down(a, k, n):' },
      { text: '    i, j = k, 2 * k + 1' },
      { text: '    while j < n:' },
      { text: '        if j + 1 < n and a[j] < a[j + 1]: j += 1', anchor: 'pickchild' },
      { text: '        if a[i] >= a[j]: break', anchor: 'cmp' },
      { text: '        a[i], a[j] = a[j], a[i]', anchor: 'swap' },
      { text: '        i, j = j, 2 * j + 1', anchor: 'down' },
      { text: 'def heap_sort(a):' },
      { text: '    n = len(a)' },
      { text: '    for k in range(n // 2 - 1, -1, -1): sift_down(a, k, n)', anchor: 'build' },
      { text: '    for end in range(n - 1, 0, -1):' },
      { text: '        a[0], a[end] = a[end], a[0]', anchor: 'extract' },
      { text: '        sift_down(a, 0, end)', anchor: 'resort' },
      { text: '    return a', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把数组看成一棵完全二叉树：下标 i 的左右孩子是 2i+1 与 2i+2。大根堆要求每个结点都不小于孩子，因此堆顶就是全局最大值。排序分两步：先把无序数组调成大根堆，再反复「堆顶与末尾交换 → 堆长度减一 → 新堆顶向下调整」。',
      points: [
        '建初堆从最后一个非叶结点 n/2-1 开始，自下而上调整，复杂度 O(n)',
        '每次取出堆顶后只需调整一条路径，单次 O(log n)，总计 O(n log n)',
        '向下调整必须「先选出较大的孩子」，否则换上去的仍可能比孩子小',
      ],
    },
    {
      heading: '为什么空间是 O(1)',
      body: '堆排序全程在数组内部交换，不需要额外的辅助数组（对比归并排序需要 O(n) 的辅助空间）。代价是交换会把相等元素的相对次序打乱，所以它是不稳定排序。',
    },
    {
      heading: '易错点',
      body: '向下调整时 n 参数必须传「当前堆的有效长度」，而不是数组总长，否则会把已经排好序的尾部又拉回堆里。',
    },
  ],
  quiz: [
    { q: '建初堆应该从哪个结点开始向下调整？', options: ['根结点 0', '最后一个非叶结点 n/2-1', '最后一个结点 n-1', '任意结点'], answer: 1, explain: '叶子本身已满足堆性质，只需从最后一个非叶结点开始自下而上调整。' },
    { q: '堆排序的空间复杂度是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 0, explain: '原地交换，只需常数个临时变量。' },
    { q: '每次把堆顶与末尾交换后，下一步做什么？', options: ['重新建堆', '对剩余部分从堆顶向下调整', '从末尾向上调整', '直接结束'], answer: 1, explain: '除堆顶外其余部分仍满足堆性质，只需对新堆顶做一次向下调整。' },
  ],
  generate: (input) => {
    const vals = (input.length >= 2 ? input : [49, 38, 65, 97, 76, 13, 27]).slice(0, 10).slice();
    const n = vals.length;
    const ids = vals.map((_, i) => `h${i}`);
    const steps: TraceStep[] = [];
    let k = 0;
    let comparisons = 0;
    let swaps = 0;
    const sortedTail = new Set<number>();
    const heapSize = { v: n };

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      hot: Record<number, NodeState>,
      extra: Record<string, string | number> = {},
    ) => {
      const nodes = vals.map((v, i) =>
        node(ids[i], v, sortedTail.has(i) ? 'sorted' : (hot[i] ?? 'default')),
      );
      const pointers: ScenePointer[] = [{ label: '堆顶', index: heapSize.v > 0 ? 0 : null }];
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          arrayScene(nodes, pointers, n, `堆长度 ${heapSize.v} / ${n}`),
          { 堆长度: heapSize.v, 已归位: sortedTail.size, 堆顶: heapSize.v > 0 ? vals[0] : '—', ...extra },
          caption,
        ),
      );
      steps[steps.length - 1].metrics = { comparisons, swaps, writes: swaps * 2 };
    };

    const siftDown = (start: number, limit: number) => {
      let i = start;
      let j = 2 * i + 1;
      while (j < limit) {
        let big = j;
        if (j + 1 < limit) {
          comparisons += 1;
          push('pickchild', '比较左右孩子', `结点 a[${i}]=${vals[i]} 的左右孩子是 ${vals[j]} 与 ${vals[j + 1]}，选出较大的那个。`, { [i]: 'active', [j]: 'compare', [j + 1]: 'compare' });
          if (vals[j] < vals[j + 1]) big = j + 1;
        }
        comparisons += 1;
        push('cmp', '父与较大孩子比较', `比较父 ${vals[i]} 与较大孩子 ${vals[big]}：${vals[i] >= vals[big] ? '父不小于孩子，调整结束' : '父小于孩子，需要交换'}。`, { [i]: 'active', [big]: 'compare' });
        if (vals[i] >= vals[big]) break;
        [vals[i], vals[big]] = [vals[big], vals[i]];
        swaps += 1;
        push('swap', '交换下沉', `交换 a[${i}] 与 a[${big}]，${vals[big]} 下沉、${vals[i]} 上浮。`, { [i]: 'insert', [big]: 'insert' });
        i = big;
        j = 2 * i + 1;
        push('down', '沿路径继续下沉', `从位置 ${i} 继续向下检查它的孩子。`, { [i]: 'active' });
      }
    };

    push('build', '建初堆', `从最后一个非叶结点 ${Math.floor(n / 2) - 1} 号位置开始，自下而上把数组调成大根堆。`, {});
    for (let s = Math.floor(n / 2) - 1; s >= 0; s--) {
      push('build', '建初堆', `调整以 ${vals[s]} 为根的子树。`, { [s]: 'active' });
      siftDown(s, n);
    }
    push('build', '建初堆完成', `大根堆建成，堆顶 ${vals[0]} 是当前最大值。`, { 0: 'found' });

    for (let end = n - 1; end > 0; end--) {
      [vals[0], vals[end]] = [vals[end], vals[0]];
      swaps += 1;
      sortedTail.add(end);
      heapSize.v = end;
      push('extract', '取堆顶归位', `堆顶与末尾 a[${end}] 交换，${vals[end]} 归位，堆长度减为 ${end}。`, { [end]: 'sorted' });
      push('resort', '调整新堆顶', `对新的堆顶 ${vals[0]} 做一次向下调整，恢复大根堆性质。`, { 0: 'active' });
      siftDown(0, end);
    }
    sortedTail.add(0);
    heapSize.v = 0;
    push('done', '排序完成', `堆长度归零，整个数组升序排列：${vals.join(', ')}。`, {});
    return steps;
  },
};
