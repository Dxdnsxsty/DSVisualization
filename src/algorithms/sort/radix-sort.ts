import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, auxStruct, makeStep, node } from '../../engine/scene';

const DEFAULT = [278, 109, 63, 930, 589, 184, 505, 269, 8, 83];
const POS_NAME = ['个位', '十位', '百位'];

export const radixSort: AlgorithmMeta = {
  slug: 'sort/radix-sort',
  title: '基数排序',
  chapter: '第 10 章 内排序',
  category: 'ch10',
  summary: '按个位到高位反复分配进桶再依次收集。',
  complexity: { time: 'O(d(n+r))', space: 'O(n+r)', extra: 'd 为位数，r 为基数 10；稳定排序' },
  difficulty: '进阶',
  inputHint: '输入 2–10 个非负整数作为待排序序列，按个位、十位、百位依次分配与收集。',
  defaultInput: DEFAULT,
  input: {
    min: 0,
    max: 999,
    minLen: 2,
    maxLen: 10,
    // 按十进制位分桶，负数会被 |v| 分到错误的桶里，直接拒绝
    check: (v) => (v.some((x) => x < 0) ? '基数排序按十进制位分桶，需要非负整数' : null),
  },
  code: {
    cpp: [
      { text: 'void RadixSort(int A[], int n) {' },
      { text: '  int bucket[10][MAXN], count[10];', anchor: 'build' },
      { text: '  for (int p = 1; p <= 100; p *= 10) {', anchor: 'pass' },
      { text: '    for (int d = 0; d < 10; d++) count[d] = 0;' },
      { text: '    for (int i = 0; i < n; i++) {', anchor: 'dist' },
      { text: '      int d = A[i] / p % 10;  // 取当前位' },
      { text: '      bucket[d][count[d]++] = A[i];' },
      { text: '    }' },
      { text: '    int t = 0;', anchor: 'collect' },
      { text: '    for (int d = 0; d < 10; d++)' },
      { text: '      for (int j = 0; j < count[d]; j++) A[t++] = bucket[d][j];' },
      { text: '    // 本趟结束，A 已按该位有序', anchor: 'writeback' },
      { text: '  }' },
      { text: '}  // 排序完成', anchor: 'done' },
    ],
    python: [
      { text: 'def radix_sort(A):' },
      { text: '    # 桶：下标 0-9，共 10 个', anchor: 'build' },
      { text: '    for p in (1, 10, 100):', anchor: 'pass' },
      { text: '        buckets = [[] for _ in range(10)]' },
      { text: '        for x in A:', anchor: 'dist' },
      { text: '            buckets[x // p % 10].append(x)' },
      { text: '        A[:] = [x for b in buckets for x in b]', anchor: 'collect' },
      { text: '        # 本趟结束，A 已按该位有序', anchor: 'writeback' },
      { text: '    return A', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '基数排序不比较关键字大小，而是按位「分配—收集」。第一趟看个位，把每个数放进 0–9 号桶，再按桶号从小到大把数串起来；第二趟看十位，重复同样的动作；一直到最高位。所有趟结束后整个序列就有序了，这种方法叫最低位优先（LSD）。',
      points: [
        '每趟只处理一位，十位与百位不受个位影响，因为收集时低位的有序性会被保留',
        '桶的数量等于基数，十进制就是 10 个桶',
        '分配时同桶内保持原有次序，这一点决定了算法必须稳定',
      ],
    },
    {
      heading: '为什么必须稳定',
      body: '第二趟按十位分配时，个位的有序信息只能靠「同桶内先来后到」保留下来。如果分配或收集过程打乱了同桶元素的相对次序，上一趟的排序结果就被破坏，最终无法得到正确顺序。所以基数排序是稳定排序的典型代表。',
    },
    {
      heading: '复杂度与适用场景',
      body: '设有 n 个元素、最多 d 位、基数为 r，每趟分配 O(n)、收集 O(n+r)，共 d 趟，时间 O(d(n+r))，空间需要 n 个元素的桶空间加 r 个计数器。它不适合位数很多的数，也不适合浮点数与负数（需要额外处理符号位）。',
      points: ['关键字位数少、数量大时比比较排序更快', '示例三轮后结果为 8、63、83、109、184、269、278、505、589、930', '把基数取大（如 1000）可以减少趟数，但桶空间随之变大'],
    },
  ],
  quiz: [
    { q: '基数排序的第一趟按哪一位分配？', options: ['最高位', '最低位（个位）', '中间位', '随机一位'], answer: 1, explain: 'LSD 从最低位开始，逐趟向高位推进，靠稳定性保留低位的排序结果。' },
    { q: '基数排序为什么要求分配与收集过程稳定？', options: ['为了减少比较次数', '为了保留上一趟低位的有序结果', '为了节省桶空间', '为了处理负数'], answer: 1, explain: '同桶内保持原次序，低位的排序结果才能在高位相同的元素之间继续有效。' },
    { q: '示例序列 [278, 109, 63, 930, ...] 第一趟收集后的前三个数是？', options: ['930、63、83', '63、83、184', '8、63、83', '109、184、269'], answer: 0, explain: '个位为 0 的 930 先进桶 0，个位为 3 的 63、83 随后进桶 3，收集时按桶号从小到大排列。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const vals = (raw.length >= 2 ? raw : DEFAULT).slice(0, 10).map((v) => Math.trunc(v));
    const n = vals.length;
    let arr = [...vals];
    const maxAbs = Math.max(...arr.map((v) => Math.abs(v)));
    let digits = 1;
    while (Math.pow(10, digits) <= maxAbs) digits += 1;
    const steps: TraceStep[] = [];
    let k = 0;
    let curIdx = -1;
    let curDigit = -1;
    let placed = 0;
    let buckets: number[][] = Array.from({ length: 10 }, () => []);
    let round = 0;
    let done = false;

    const digitOf = (v: number, p: number) => Math.floor(Math.abs(v) / Math.pow(10, p)) % 10;

    const push = (anchor: string, phase: string, caption: string) => {
      const mainNodes = arr.map((v, i) =>
        node(
          `r${i}`,
          v,
          done ? 'sorted' : i === curIdx ? 'active' : curIdx >= 0 && i < curIdx ? 'visited' : 'default',
        ),
      );
      const auxNodes = buckets.map((b, d) =>
        node(`b${d}`, `${d}:${b.length ? b.join(' ') : '·'}`, d === curDigit ? 'insert' : 'default', `桶 ${d}`),
      );
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...arrayScene(
              mainNodes,
              [],
              n,
              round === 0 ? `共 ${digits} 趟：个位 → 十位 → 百位` : `第 ${round} / ${digits} 趟：按${POS_NAME[round - 1]}分配`,
            ),
            aux: auxStruct('10 个桶的内容（桶号:元素）', auxNodes),
          },
          {
            趟次: `${round} / ${digits}`,
            当前元素: curIdx >= 0 ? arr[curIdx] : '—',
            当前位值: curDigit >= 0 ? curDigit : '—',
            已分配: `${placed} / ${n}`,
            已排序: done ? '是' : '否',
          },
          caption,
        ),
      );
    };

    push(
      'build',
      '初始化',
      `待排序序列为 ${arr.join('、')}，最大数 ${maxAbs}，需要 ${digits} 趟分配与收集。`,
    );

    for (let p = 0; p < digits; p++) {
      round = p + 1;
      buckets = Array.from({ length: 10 }, () => []);
      curDigit = -1;
      placed = 0;
      push(
        'pass',
        `第 ${round} 趟开始`,
        `本轮按${POS_NAME[p] ?? '更高位'}分配：依次取出每个数，看它的${POS_NAME[p] ?? '当前位'}是几，就放进几号桶。`,
      );

      for (let i = 0; i < n; i++) {
        const d = digitOf(arr[i], p);
        buckets[d].push(arr[i]);
        curIdx = i;
        curDigit = d;
        placed += 1;
        push(
          'dist',
          '分配到桶',
          `${arr[i]} 的${POS_NAME[p] ?? '当前位'}是 ${d}，放入桶 ${d}；桶内保持取出的先后次序。`,
        );
      }

      curIdx = -1;
      curDigit = -1;
      const collected = buckets.flat();
      push(
        'collect',
        '按桶收集',
        `从桶 0 到桶 9 依次收集，得到 ${collected.join('、')}，此时序列已按${POS_NAME[p] ?? '当前位'}有序。`,
      );

      arr = collected;
      placed = n;
      push(
        'writeback',
        '写回主数组',
        `第 ${round} 趟结束，把收集结果写回主数组：${arr.join('、')}。${p + 1 < digits ? '进入下一趟。' : ''}`,
      );
    }

    done = true;
    push('done', '完成', `全部 ${digits} 趟结束，序列已整体有序：${arr.join('、')}。`);
    return steps;
  },
};
