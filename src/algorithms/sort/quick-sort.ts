import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const quickSort: AlgorithmMeta = {
  slug: 'sort/quick-sort',
  title: '快速排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '以首元素为枢轴，双指针填坑，一趟划分定一位。',
  complexity: { time: 'O(n log n)', space: 'O(log n)', extra: '不稳定；最坏 O(n²)' },
  difficulty: '进阶',
  inputHint: '输入 2–10 个整数作为待排序序列；采用挖坑法划分，观察 i、j 两个指针相向扫描。',
  defaultInput: [49, 38, 65, 97, 76, 13, 27, 49],
  input: { min: -999, max: 999, minLen: 2, maxLen: 10 },
  code: {
    cpp: [
      { text: 'void QuickSort(int A[], int s, int t) {', anchor: 'enter' },
      { text: '  if (s >= t) return;', anchor: 'guard' },
      { text: '  int i = s, j = t, tmp = A[s];', anchor: 'pivot' },
      { text: '  while (i < j) {' },
      { text: '    while (i < j && A[j] >= tmp) j--;', anchor: 'scanR' },
      { text: '    if (i < j) { A[i] = A[j]; i++; }', anchor: 'moveR' },
      { text: '    while (i < j && A[i] <= tmp) i++;', anchor: 'scanL' },
      { text: '    if (i < j) { A[j] = A[i]; j--; }', anchor: 'moveL' },
      { text: '  }' },
      { text: '  A[i] = tmp;', anchor: 'place' },
      { text: '  QuickSort(A, s, i - 1);' },
      { text: '  QuickSort(A, i + 1, t);' },
      { text: '}', anchor: 'ret' },
      { text: '// 所有子区间处理完毕，排序结束', anchor: 'done' },
    ],
    python: [
      { text: 'def quick_sort(A, s, t):', anchor: 'enter' },
      { text: '    if s >= t:', anchor: 'guard' },
      { text: '        return' },
      { text: '    i, j, tmp = s, t, A[s]', anchor: 'pivot' },
      { text: '    while i < j:' },
      { text: '        while i < j and A[j] >= tmp:', anchor: 'scanR' },
      { text: '            j -= 1' },
      { text: '        if i < j:' },
      { text: '            A[i] = A[j]', anchor: 'moveR' },
      { text: '            i += 1' },
      { text: '        while i < j and A[i] <= tmp:', anchor: 'scanL' },
      { text: '            i += 1' },
      { text: '        if i < j:' },
      { text: '            A[j] = A[i]', anchor: 'moveL' },
      { text: '            j -= 1' },
      { text: '    A[i] = tmp', anchor: 'place' },
      { text: '    quick_sort(A, s, i - 1)' },
      { text: '    quick_sort(A, i + 1, t)', anchor: 'ret' },
      { text: '    # 排序结束', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想（挖坑法）',
      body: '本实现用的是挖坑法：取区间首元素 A[s] 存进 tmp，原位置空出一个「坑」；右指针 j 从右往左找第一个小于 tmp 的元素，把它填进左坑，空出的位置变成新的坑；再让左指针 i 从左往右找第一个大于 tmp 的元素填进右坑。i、j 相遇时把 tmp 填进最后的坑，枢轴就位。',
      points: [
        '坑的位置在 i 与 j 之间来回转移，所以每步只有一次赋值',
        '内层两个 while 都带 i < j 条件，否则指针会越界并互相穿过',
        '划分结束时 i == j，该位置左边都不大于 tmp，右边都不小于 tmp',
      ],
    },
    {
      heading: '递归与效率',
      body: '枢轴就位后，对左右两个子区间递归同样的划分过程。每趟划分把区间分成两段，平均递归深度 O(log n)，时间 O(n log n)。当序列已经有序且固定取首元素作枢轴时，每次划分只能减少一个元素，退化为 O(n²)，此时可用「三数取中」或随机枢轴缓解。',
    },
    {
      heading: '易错点',
      body: '快排是不稳定排序：挖坑填数会把相同关键字的相对次序打乱。此外递归出口必须写成 s >= t，只写 s == t 会在空区间上继续递归导致越界。',
      points: ['内层比较的方向与坑的位置必须成对出现', '小数据量时可改用插入排序收尾', '递归栈深度最坏为 O(n)，可先递归短的一侧'],
    },
  ],
  quiz: [
    { q: '挖坑法中，一趟划分结束时 i 与 j 的关系是？', options: ['i = j + 1', 'i = j', 'i < j', 'j = 0'], answer: 1, explain: '两个指针相向扫描直到相遇，此时 i 与 j 相等，枢轴填入该位置。' },
    { q: '本实现中最坏情况 O(n²) 何时出现？', options: ['序列随机', '序列已有序且固定取首元素为枢轴', '序列全部相等', '元素个数为偶数'], answer: 1, explain: '有序时每次划分都极不均衡，只缩小一个元素，递归深度达到 n。' },
    { q: '快速排序是否稳定？', options: ['稳定', '不稳定', '与枢轴选择有关', '只对整数不稳定'], answer: 1, explain: '挖坑填数会跨距离搬移元素，相同关键字的相对次序可能改变。' },
  ],
  generate: (input) => {
    const vals = (input.length >= 2 ? input : [49, 38, 65, 97, 76, 13, 27, 49]).slice(0, 10);
    const n = vals.length;
    const arr = [...vals];
    const ids = arr.map((_, i) => `p${i}`);
    const final = new Set<number>();
    const steps: TraceStep[] = [];
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState>,
      stack: string[],
      info: { lo: number; hi: number; pivot: number | string; i: number; j: number },
    ) => {
      const nodes = ids.map((id, idx) =>
        node(id, arr[idx], states[idx] ?? (final.has(idx) ? 'sorted' : 'default')),
      );
      const pointers: ScenePointer[] = [
        { label: 'i', index: info.i >= 0 ? info.i : null },
        { label: 'j', index: info.j >= 0 ? info.j : null },
      ];
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          arrayScene(nodes, pointers, n, `当前区间 [${info.lo}, ${info.hi}]，枢轴 ${info.pivot === '—' ? '未定' : info.pivot}`),
          {
            区间: `[${info.lo}, ${info.hi}]`,
            枢轴: info.pivot,
            i: info.i,
            j: info.j,
          },
          caption,
          stack.length ? [...stack] : undefined,
        ),
      );
    };

    const qs = (s: number, t: number, stack: string[]): void => {
      stack.push(`Qsort(${s}, ${t})`);
      push('enter', '进入区间', `处理子区间 [${s}, ${t}]。`, {}, stack, { lo: s, hi: t, pivot: '—', i: s, j: t });
      if (s >= t) {
        if (s === t) final.add(s);
        push(
          'guard',
          '递归出口',
          s === t ? `区间只剩 A[${s}] = ${arr[s]}，天然有序，直接返回。` : '区间为空，直接返回。',
          {},
          stack,
          { lo: s, hi: t, pivot: '—', i: s, j: t },
        );
        stack.pop();
        return;
      }

      const tmp = arr[s];
      let i = s;
      let j = t;
      push('pivot', '选定枢轴', `取 A[${s}] = ${tmp} 作枢轴，位置 ${s} 成为第一个「坑」。`, { [s]: 'min' }, stack, { lo: s, hi: t, pivot: tmp, i, j });

      while (i < j) {
        while (i < j && arr[j] >= tmp) {
          push('scanR', '右指针左扫', `A[${j}] = ${arr[j]} ≥ 枢轴 ${tmp}，不是要填坑的值，j 左移到 ${j - 1}。`, { [j]: 'compare', [s]: 'min' }, stack, { lo: s, hi: t, pivot: tmp, i, j });
          j -= 1;
        }
        if (i < j) {
          const v = arr[j];
          arr[i] = v;
          push('moveR', '填入左坑', `A[${j}] = ${v} < 枢轴 ${tmp}，填进左坑 A[${i}]，i 右移，坑转到 ${j}。`, { [i]: 'insert', [j]: 'min' }, stack, { lo: s, hi: t, pivot: tmp, i, j });
          i += 1;
        }
        while (i < j && arr[i] <= tmp) {
          push('scanL', '左指针右扫', `A[${i}] = ${arr[i]} ≤ 枢轴 ${tmp}，留在左边即可，i 右移到 ${i + 1}。`, { [i]: 'compare', [s]: 'min' }, stack, { lo: s, hi: t, pivot: tmp, i, j });
          i += 1;
        }
        if (i < j) {
          const v = arr[i];
          arr[j] = v;
          push('moveL', '填入右坑', `A[${i}] = ${v} > 枢轴 ${tmp}，填进右坑 A[${j}]，j 左移，坑转到 ${i}。`, { [i]: 'min', [j]: 'insert' }, stack, { lo: s, hi: t, pivot: tmp, i, j });
          j -= 1;
        }
      }

      arr[i] = tmp;
      final.add(i);
      push('place', '枢轴就位', `i 与 j 在 ${i} 相遇，写入枢轴 ${tmp}，它的最终位置确定为 ${i}。`, { [i]: 'sorted' }, stack, { lo: s, hi: t, pivot: tmp, i, j });

      qs(s, i - 1, stack);
      qs(i + 1, t, stack);
      stack.pop();
      push('ret', '本层返回', `区间 [${s}, ${t}] 左右两段都排好，本次调用返回上一层。`, {}, stack, { lo: s, hi: t, pivot: tmp, i, j });
    };

    qs(0, n - 1, []);
    push('done', '完成', `排序完成：${arr.join(', ')}。`, {}, [], { lo: 0, hi: n - 1, pivot: '—', i: -1, j: -1 });
    return steps;
  },
};
