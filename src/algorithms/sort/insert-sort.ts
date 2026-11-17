import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const insertSort: AlgorithmMeta = {
  slug: 'sort/insert-sort',
  title: '直接插入排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '暂存待插入元素，边比较边后移，空出位置再落座。',
  complexity: { time: 'O(n²)', space: 'O(1)', extra: '稳定排序；基本有序时接近 O(n)' },
  difficulty: '入门',
  inputHint: '输入 2–10 个整数作为待排序序列；重点观察 temp 的暂存与 j 指针的后移。',
  defaultInput: [20, 60, 30, 10, 40, 90],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: 'void InsertSort(int A[], int n) {', anchor: 'init' },
      { text: '  for (int i = 1; i < n; i++) {', anchor: 'outer' },
      { text: '    int temp = A[i];', anchor: 'pick' },
      { text: '    int j = i - 1;' },
      { text: '    while (j >= 0) {' },
      { text: '      if (A[j] > temp) {', anchor: 'cmp' },
      { text: '        A[j + 1] = A[j];', anchor: 'move' },
      { text: '        j--;' },
      { text: '      } else break;' },
      { text: '    }' },
      { text: '    A[j + 1] = temp;', anchor: 'place' },
      { text: '  }', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def insert_sort(A):', anchor: 'init' },
      { text: '    for i in range(1, len(A)):', anchor: 'outer' },
      { text: '        temp = A[i]', anchor: 'pick' },
      { text: '        j = i - 1' },
      { text: '        while j >= 0:' },
      { text: '            if A[j] > temp:', anchor: 'cmp' },
      { text: '                A[j + 1] = A[j]', anchor: 'move' },
      { text: '                j -= 1' },
      { text: '            else:' },
      { text: '                break' },
      { text: '        A[j + 1] = temp', anchor: 'place' },
      { text: '    return A', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '把序列看成「有序区 + 无序区」，初始时有序区只有 A[0]。每趟取出无序区的第一个元素存到 temp，然后从有序区尾部向前比较：比 temp 大的元素统统后移一格，直到遇到不大于 temp 的元素或走到表头，再把 temp 放进空出的位置。',
      points: [
        'temp 必须先暂存，否则后移会把它覆盖掉',
        '比较从后往前，一边比较一边移动，天然稳定',
        'j 循环结束时插入位置是 j+1，不是 j',
      ],
    },
    {
      heading: '为什么稳定',
      body: '内层循环的判定是 A[j] > temp，遇到相等元素就停下，暂存元素被放在相等元素的后面，原有相对次序不变，因此是稳定排序。若写成 >=，相等元素会被不断后移，稳定性被破坏。',
    },
    {
      heading: '复杂度与效率',
      body: '最好情况（原本有序）每趟只比较一次、不移动，时间 O(n)；最坏与平均为 O(n²)，移动次数约为 n²/4。空间只需一个 temp，O(1)。当序列基本有序或元素较少时，直接插入排序反而优于快排，所以常被用作快排小区间的收尾手段。',
      points: ['折半插入排序可把比较次数降到 O(n log n)，但移动次数不变', '希尔排序是它的分组改进版', '哨兵写法可以省掉 j >= 0 的边界判断'],
    },
  ],
  quiz: [
    { q: '内层循环结束后，temp 应该写入哪个位置？', options: ['下标 j', '下标 j+1', '下标 i', '下标 0'], answer: 1, explain: 'j 停在「不大于 temp」的元素上，插入位置在它后面，即 j+1。' },
    { q: '为什么必须先把 A[i] 存到 temp？', options: ['为了减少比较次数', '否则后移会覆盖掉待插入元素', '为了保持稳定性', '为了节省空间'], answer: 1, explain: 'A[j+1] = A[j] 会覆盖 A[i]，必须提前备份。' },
    { q: '直接插入排序在什么情况下最快？', options: ['完全逆序', '完全有序', '随机排列', '全部相等且用 >'], answer: 1, explain: '完全有序时每趟只比较一次、不做移动，总时间 O(n)。' },
  ],
  generate: (input) => {
    const vals = (input.length >= 2 ? input : [20, 60, 30, 10, 40, 90]).slice(0, 10);
    const n = vals.length;
    const arr = [...vals];
    const ids = arr.map((_, i) => `p${i}`);
    const steps: TraceStep[] = [];
    let k = 0;
    let comparisons = 0;
    let moves = 0;
    let sortedCount = 1;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState>,
      temp: number | null,
      i: number,
      j: number,
    ) => {
      const nodes = ids.map((id, idx) =>
        node(id, arr[idx], states[idx] ?? (idx < sortedCount ? 'sorted' : 'default')),
      );
      const pointers: ScenePointer[] = [
        { label: 'i', index: i >= 0 && i < n ? i : null },
        { label: 'j', index: j >= 0 ? j : null },
      ];
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          arrayScene(nodes, pointers, n, `有序区 0 ~ ${sortedCount - 1}，待插入元素 ${temp === null ? '—' : temp}`),
          {
            temp: temp === null ? '—' : temp,
            i,
            j,
            比较次数: comparisons,
            移动次数: moves,
          },
          caption,
        ),
      );
    };

    push('init', '初始化', 'A[0] 自成一个有序区，从下标 1 开始逐个把元素插入有序区。', {}, null, 0, -1);

    for (let i = 1; i < n; i++) {
      sortedCount = i;
      const temp = arr[i];
      push('outer', `第 ${i} 趟`, `有序区为 0 ~ ${i - 1}，取出 A[${i}] = ${temp} 准备插入。`, { [i]: 'active' }, temp, i, i - 1);
      let j = i - 1;
      push('pick', '暂存元素', `temp = ${temp}，位置 ${i} 的旧值已备份，后面的元素可以放心后移。`, { [i]: 'min' }, temp, i, j);

      while (j >= 0) {
        comparisons += 1;
        const bigger = arr[j] > temp;
        push(
          'cmp',
          '比较',
          `比较 A[${j}] = ${arr[j]} 与 temp = ${temp}：${bigger ? '更大，需要后移' : '不大于 temp，插入位置找到了'}。`,
          { [j]: 'compare' },
          temp,
          i,
          j,
        );
        if (bigger) {
          const from = j;
          arr[from + 1] = arr[from];
          moves += 1;
          j -= 1;
          push('move', '后移一格', `A[${from}] = ${arr[from]} 复制到 A[${from + 1}]，A[${from}] 成为待填的空位，j 左移到 ${j}。`, { [from]: 'active', [from + 1]: 'insert' }, temp, i, j);
        } else {
          break;
        }
      }
      arr[j + 1] = temp;
      sortedCount = i + 1;
      push('place', '插入就位', `把 temp = ${temp} 写入下标 ${j + 1}，有序区扩大到 0 ~ ${i}。`, { [j + 1]: 'insert' }, null, i, j);
    }
    sortedCount = n;
    push('done', '完成', `排序完成：${arr.join(', ')}。共比较 ${comparisons} 次，移动 ${moves} 次。`, {}, null, n - 1, -1);
    return steps;
  },
};
