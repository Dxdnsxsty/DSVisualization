import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

const DEFAULT = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92, 21];

export const binarySearch: AlgorithmMeta = {
  slug: 'search/binary-search',
  title: '折半查找',
  chapter: '第 9 章 查找',
  category: 'ch9',
  summary: '每个 mid 比较一次，区间减半。',
  complexity: { time: 'O(log n)', space: 'O(1)', extra: '仅适用于有序的顺序表' },
  difficulty: '入门',
  inputHint: '输入若干整数：最后一个数是查找目标，其余是待查元素（会自动按升序整理）。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 3, maxLen: 12 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'int BinSearch(int A[], int n, int target) {' },
      { text: '  int low = 0, high = n - 1;', anchor: 'init' },
      { text: '  while (low <= high) {', anchor: 'loop' },
      { text: '    int mid = (low + high) / 2;', anchor: 'mid' },
      { text: '    if (A[mid] == target)', anchor: 'cmp' },
      { text: '      return mid;', anchor: 'found' },
      { text: '    if (A[mid] < target)' },
      { text: '      low = mid + 1;', anchor: 'right' },
      { text: '    else' },
      { text: '      high = mid - 1;', anchor: 'left' },
      { text: '  }' },
      { text: '  return -1;', anchor: 'fail' },
      { text: '}' },
    ],
    python: [
      { text: 'def bin_search(a, target):' },
      { text: '    low = 0', anchor: 'init' },
      { text: '    high = len(a) - 1' },
      { text: '    while low <= high:', anchor: 'loop' },
      { text: '        mid = (low + high) // 2', anchor: 'mid' },
      { text: '        if a[mid] == target:', anchor: 'cmp' },
      { text: '            return mid', anchor: 'found' },
      { text: '        if a[mid] < target:' },
      { text: '            low = mid + 1', anchor: 'right' },
      { text: '        else:' },
      { text: '            high = mid - 1', anchor: 'left' },
      { text: '    return -1', anchor: 'fail' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '折半查找要求表按关键字有序且顺序存储。每轮取区间中点 mid，比较 A[mid] 与目标：相等则命中；A[mid] 小于目标说明目标只可能在右半区，令 low = mid+1；否则令 high = mid-1。每轮区间长度至少减半，因此最多比较约 log₂n + 1 次。',
      points: [
        'mid 通常写作 (low+high)/2，向下取整',
        '区间是闭区间 [low, high]，所以 while 条件是 low <= high',
        '收缩时必须跨过 mid（mid+1 / mid-1），否则会死循环',
      ],
    },
    {
      heading: '判定树与复杂度',
      body: '把每轮 mid 的比较过程画成二叉树，就得到折半查找的判定树：树高约 log₂n + 1，查找成功最多比较 h 次，失败也要走到叶子。因此时间复杂度 O(log n)，空间 O(1)，优于顺序查找的 O(n)，但代价是表必须有序，维护有序需要额外成本。',
      points: ['只适合顺序存储：链表无法 O(1) 定位 mid', '插入删除频繁的场景更适合二叉排序树或跳表'],
    },
  ],
  quiz: [
    { q: '折半查找的循环条件是？', options: ['low < high', 'low <= high', 'low != high', 'mid < high'], answer: 1, explain: '闭区间 [low, high] 非空的条件是 low <= high。' },
    { q: '11 个元素的有序表折半查找，最多比较几次？', options: ['3 次', '4 次', '5 次', '11 次'], answer: 1, explain: '判定树高为 ⌊log₂11⌋+1 = 4，最多比较 4 次。' },
    { q: '折半查找为什么不能直接用于链表？', options: ['链表元素无序', '链表无法 O(1) 定位 mid 结点', '链表不能比较大小', '链表空间更大'], answer: 1, explain: '按下标取 mid 需要顺序访问，链表要 O(n) 走到中点。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const raw = input.length >= 3 && input.every((v) => Number.isFinite(v)) ? input : DEFAULT;
    const target = Math.trunc(raw[raw.length - 1]);
    const vals = raw.slice(0, -1).slice(0, 12).map((v) => Math.trunc(v)).sort((a, b) => a - b);
    const n = vals.length;
    let low = 0;
    let high = n - 1;
    let compares = 0;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState> = {},
      mid: number | null = null,
    ) => {
      const pointers: ScenePointer[] = [
        { label: 'low', index: low },
        { label: 'high', index: high },
      ];
      if (mid !== null) pointers.push({ label: 'mid', index: mid });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          arrayScene(
            vals.map((v, i) => node(`a${i}`, v, states[i] ?? 'default')),
            pointers,
            undefined,
            `升序表 · 目标 ${target}`,
          ),
          { low, high, mid: mid === null ? '—' : mid, 区间长度: Math.max(high - low + 1, 0), 比较次数: compares },
          caption,
        ),
      );
    };

    push('init', '初始化', `有序表共 ${n} 个元素，low = 0、high = ${n - 1}，在整个区间内查找 ${target}。`);
    let found = false;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      push('mid', '取中间位置', `区间 [${low}, ${high}] 共 ${high - low + 1} 个元素，mid = (low+high)/2 = ${mid}。`, { [mid]: 'active' }, mid);
      compares += 1;
      const v = vals[mid];
      push(
        'cmp',
        '比较关键字',
        `比较 A[${mid}] = ${v} 与目标 ${target}：${v === target ? '相等，查找成功。' : v < target ? '小于目标，目标只可能在右半区。' : '大于目标，目标只可能在左半区。'}`,
        { [mid]: 'compare' },
        mid,
      );
      if (v === target) {
        push('found', '查找成功', `命中下标 ${mid}，第 ${compares} 次比较就找到了 ${target}。`, { [mid]: 'found' }, mid);
        found = true;
        break;
      }
      if (v < target) {
        low = mid + 1;
        push('right', '收缩区间', `low = mid + 1 = ${low}，mid 及其左边全部丢弃。`, { [mid]: 'visited' }, mid);
      } else {
        high = mid - 1;
        push('left', '收缩区间', `high = mid - 1 = ${high}，mid 及其右边全部丢弃。`, { [mid]: 'visited' }, mid);
      }
    }
    if (!found) {
      push('fail', '查找失败', `low = ${low} 已大于 high = ${high}，区间为空，表中不存在 ${target}，共比较 ${compares} 次。`);
    }
    return steps;
  },
};
