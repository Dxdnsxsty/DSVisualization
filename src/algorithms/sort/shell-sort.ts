import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

/** 增量取 d = n/2、n/4 … 1，逐趟把序列切成 d 组做插入排序。 */
export const shellSort: AlgorithmMeta = {
  slug: 'sort/shell-sort',
  title: '希尔排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '按增量分组做插入排序，增量降到 1 即完成。',
  complexity: { time: 'O(n^1.3) 左右', space: 'O(1)', extra: '不稳定排序；效率取决于增量序列' },
  difficulty: '进阶',
  inputHint: '输入 2–12 个整数作为待排序序列；默认增量序列为 d = n/2、n/4 … 1。',
  defaultInput: [49, 38, 65, 97, 76, 13, 27, 49],
  input: { min: -999, max: 999, minLen: 2, maxLen: 12 },
  code: {
    cpp: [
      { text: 'void ShellSort(int A[], int n) {', anchor: 'init' },
      { text: '  for (int d = n / 2; d >= 1; d = d / 2) {', anchor: 'gap' },
      { text: '    for (int i = d; i < n; i++) {', anchor: 'outer' },
      { text: '      int temp = A[i];', anchor: 'pick' },
      { text: '      int j = i - d;' },
      { text: '      while (j >= 0) {' },
      { text: '        if (A[j] > temp) {', anchor: 'cmp' },
      { text: '          A[j + d] = A[j];', anchor: 'move' },
      { text: '          j -= d;' },
      { text: '        } else break;' },
      { text: '      }' },
      { text: '      A[j + d] = temp;', anchor: 'place' },
      { text: '    }' },
      { text: '  }' },
      { text: '  // 增量降到 1 时就是直接插入排序', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def shell_sort(A):' },
      { text: '    n = len(A)', anchor: 'init' },
      { text: '    d = n // 2' },
      { text: '    while d >= 1:', anchor: 'gap' },
      { text: '        for i in range(d, n):', anchor: 'outer' },
      { text: '            temp = A[i]', anchor: 'pick' },
      { text: '            j = i - d' },
      { text: '            while j >= 0:' },
      { text: '                if A[j] > temp:', anchor: 'cmp' },
      { text: '                    A[j + d] = A[j]', anchor: 'move' },
      { text: '                    j -= d' },
      { text: '                else:' },
      { text: '                    break' },
      { text: '            A[j + d] = temp', anchor: 'place' },
      { text: '        d //= 2' },
      { text: '    # 增量降到 1 时就是直接插入排序', anchor: 'done' },
      { text: '    return A' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '希尔排序是直接插入排序的分组版本。先取一个较大的增量 d，把下标相差 d 的元素看成一组，各组内做插入排序；再缩小 d 重复，直到 d = 1 时对整个序列做最后一次插入排序。前面几趟让元素大步向目标位置靠拢，最后一趟时序列已基本有序，插入排序只需很少的移动。',
      points: [
        'd 较大时每组元素少、跨度大，能迅速消除远处的逆序',
        'd 变小时组内元素变多，但此时序列已接近有序',
        'd = 1 的那一趟就是纯粹的插入排序，保证结果完全有序',
      ],
    },
    {
      heading: '为什么比直接插入快',
      body: '直接插入排序每次只能把元素前移一格，逆序对多时移动次数接近 n²/4。希尔排序先在大增量下把元素跨格搬到大致位置，逆序对数量骤减，最后一趟的移动量很小。平均复杂度约为 O(n^1.3)，取决于增量序列的选择，一般认为优于 O(n²)。',
      points: ['Hibbard 增量 2^k-1 最坏 O(n^1.5)', 'Sedgewick 增量可做到 O(n^4/3)', '增量必须最后取 1，否则不能保证有序'],
    },
    {
      heading: '易错点',
      body: '内层循环里所有下标都要带增量：比较的是 A[j] 与 temp，后移写的是 A[j+d] = A[j]，回填写的是 A[j+d] = temp。若漏掉 d 就退化成了普通插入排序。另外希尔排序会把相等元素跨组搬动，因此是不稳定排序。',
    },
  ],
  quiz: [
    {
      q: '希尔排序的增量序列最后一个必须是？',
      options: ['0', '1', 'n/2', '任意值'],
      answer: 1,
      explain: '只有增量为 1 时才对整个序列做插入排序，才能保证完全有序。',
    },
    {
      q: '8 个元素按 d = n/2 取增量，第一趟的 d 是？',
      options: ['2', '3', '4', '8'],
      answer: 2,
      explain: 'd = 8 / 2 = 4，整个序列被分成 4 组，每组 2 个元素。',
    },
    {
      q: '希尔排序为什么不稳定？',
      options: ['因为使用了递归', '因为相等元素可能被跨组搬动，相对次序改变', '因为增量序列固定', '因为它不是比较排序'],
      answer: 1,
      explain: '大增量下元素跨格移动，相等元素的先后顺序可能被打乱。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 2 ? input : [49, 38, 65, 97, 76, 13, 27, 49];
    const vals = raw.slice(0, 12).map((v) => (Number.isFinite(v) ? Math.trunc(v) : 0));
    const n = vals.length;
    const arr = [...vals];
    const gaps: number[] = [];
    for (let d = Math.floor(n / 2); d >= 1; d = Math.floor(d / 2)) gaps.push(d);

    let comparisons = 0;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState>,
      i: number,
      j: number,
      d: number,
      temp: number | null,
    ) => {
      const group = new Set<number>();
      if (d > 1 && i >= 0) {
        for (let x = i % d; x < n; x += d) group.add(x);
      }
      const nodes = arr.map((v, idx) =>
        node(`s${idx}`, v, states[idx] ?? (group.has(idx) ? 'active' : 'default')),
      );
      const pointers: ScenePointer[] = [
        { label: 'i', index: i >= 0 && i < n ? i : null },
        { label: 'j', index: j >= 0 && j < n ? j : null },
      ];
      steps.push(makeStep(
        k++, anchor, phase,
        arrayScene(nodes, pointers, n, `增量 d = ${d} · 下标相差 ${d} 的元素同色，属于同一组`),
        { 增量: d, i, j, temp: temp === null ? '—' : temp, 比较次数: comparisons },
        caption,
      ));
    };

    push('init', '初始化', `共 ${n} 个元素，增量序列为 ${gaps.join(' → ')}；d > 1 时组内插入，d = 1 时退化为直接插入排序。`, {}, -1, -1, gaps[0], null);

    for (const d of gaps) {
      push('gap', `增量 d=${d}`, `取 d = ${d}，序列被分成 ${d} 组，下标相差 ${d} 的元素同组，组内先各自排好序。`, {}, -1, -1, d, null);
      for (let i = d; i < n; i++) {
        const temp = arr[i];
        push('outer', `处理 i=${i}`, `取出 A[${i}] = ${temp}，与同组前一个元素 A[${i - d}] 比较。`, { [i]: 'active' }, i, i - d, d, temp);
        push('pick', '暂存元素', `temp = ${temp}，位置 ${i} 腾空，供同组中较大的元素后移 ${d} 格。`, { [i]: 'min' }, i, i - d, d, temp);

        let j = i - d;
        while (j >= 0) {
          comparisons += 1;
          const bigger = arr[j] > temp;
          push('cmp', '组内比较', `比较 A[${j}] = ${arr[j]} 与 temp = ${temp}：${bigger ? `更大，后移 ${d} 格` : '不大于 temp，插入位置确定'}。`, { [j]: 'compare' }, i, j, d, temp);
          if (!bigger) break;
          const from = j;
          arr[from + d] = arr[from];
          push('move', '组内后移', `A[${from + d}] = A[${from}] = ${arr[from]}，${from} 号位置变成空位，j 减到 ${from - d}。`, { [from]: 'active', [from + d]: 'insert' }, i, from, d, temp);
          j -= d;
        }

        arr[j + d] = temp;
        push('place', '插入就位', `temp = ${temp} 写入下标 ${j + d}，这一组重新有序，i 继续后移。`, { [j + d]: 'insert' }, i, j + d, d, null);
      }
    }

    const sorted: Record<number, NodeState> = {};
    for (let x = 0; x < n; x++) sorted[x] = 'sorted';
    push('done', '完成', `排序完成：${arr.join(', ')}。共比较 ${comparisons} 次，最后一趟 d = 1 就是直接插入排序。`, sorted, -1, -1, 1, null);
    return steps;
  },
};
