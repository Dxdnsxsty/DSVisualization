import type { AlgorithmMeta, NodeState, SceneNode, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

const DEFAULT = [21, 37, 88, 19, 92, 53, 64, 56, 19];

/** 顺序查找（带哨兵）：a[1..n] 存数据，a[0] 放目标值作哨兵，从后往前比较。 */
export const sequentialSearch: AlgorithmMeta = {
  slug: 'search/sequential-search',
  title: '顺序查找',
  chapter: '第 9 章 查找',
  category: 'ch9',
  summary: '从头逐个比较，哨兵省掉越界判断。',
  complexity: { time: 'O(n)', space: 'O(1)', extra: '带哨兵可把平均比较次数减半' },
  difficulty: '入门',
  inputHint: '输入若干整数：最后一个数是查找目标，前面的数依次存入 a[1] 到 a[n]。',
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 12 },
  code: {
    cpp: [
      { text: '// 顺序表 a[1..n] 存放数据，a[0] 留作哨兵', anchor: 'build' },
      { text: 'int SeqSearch(int a[], int n, int k) {' },
      { text: '  a[0] = k;', anchor: 'sentinel' },
      { text: '  int i = n;', anchor: 'init' },
      { text: '  while (a[i] != k)', anchor: 'loop' },
      { text: '    i--;', anchor: 'move' },
      { text: '  return i;', anchor: 'ret' },
      { text: '}' },
    ],
    python: [
      { text: '# 顺序表 a[1..n] 存放数据，a[0] 留作哨兵', anchor: 'build' },
      { text: 'def seq_search(a, n, k):' },
      { text: '    a[0] = k', anchor: 'sentinel' },
      { text: '    i = n', anchor: 'init' },
      { text: '    while a[i] != k:', anchor: 'loop' },
      { text: '        i -= 1', anchor: 'move' },
      { text: '    return i', anchor: 'ret' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '顺序查找是最朴素的查找：从表的一端开始，逐个把元素与目标 k 比较，相等就返回下标，扫完整个表都没有相等就说明查找失败。它对表的顺序没有要求，顺序表和链表都能用。',
      points: [
        '平均查找长度 ASL = (n+1)/2，时间复杂度 O(n)',
        '不要求有序，插入删除后也不需要重新组织数据',
        'n 较大时效率很低，只适合小表或偶尔查找的场景',
      ],
    },
    {
      heading: '哨兵的作用',
      body: '普通写法每轮循环都要判断两个条件：i >= 1 和 a[i] != k，前者是防止下标越界。把目标值先放到 a[0] 当哨兵，再从 i = n 往前找，因为 a[0] == k 一定成立，循环必然在 i = 0 处停下来，于是越界判断可以省掉，循环体内只剩一次比较。注意：0 号位是哨兵，不是真实数据，返回下标 0 表示查找失败，不能把它当成"在 0 号位找到了"。',
    },
    {
      heading: '适用场景',
      body: '数据量小、或者数据经常变动而不便维护有序性时用顺序查找最划算；表较大且查找频繁时，应改用折半查找、二叉排序树或哈希表。',
    },
  ],
  quiz: [
    { q: '带哨兵的顺序查找，哨兵应该放在哪里？', options: ['表尾 a[n+1]', '表头 a[0]', '表的中间', '任意位置都可以'], answer: 1, explain: '哨兵放在 a[0]，从后往前找时循环必然停在 0 号位，从而省去下标越界判断。' },
    { q: '返回下标 0 意味着？', options: ['在 0 号位找到了', '查找失败', '表为空', '需要重新查找'], answer: 1, explain: '0 号位是哨兵，不存放真实数据；查到 0 号位说明整表都没有目标值。' },
    { q: '顺序查找的平均查找长度约为？', options: ['1', 'log₂n', '(n+1)/2', 'n²'], answer: 2, explain: '等概率下查找第 i 个元素需比较 i 次，平均为 (1+2+…+n)/n = (n+1)/2。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const list = raw.length >= 2 ? raw.slice(0, 11) : DEFAULT;
    const target = list[list.length - 1];
    const data = list.slice(0, -1);
    const n = data.length;
    const values: (number | string)[] = ['', ...data];
    const states: Record<string, NodeState> = {};
    const steps: TraceStep[] = [];
    let k = 0;
    let i = n;
    let comparisons = 0;

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes: SceneNode[] = values.map((v, idx) =>
        node(`a${idx}`, v === '' ? '' : String(v), states[`a${idx}`] ?? 'default', idx === 0 ? '哨兵' : undefined),
      );
      const pointers: ScenePointer[] = [{ label: 'i', index: i }];
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          arrayScene(nodes, pointers, n + 1, `目标值 ${target}，a[0] 为哨兵（不参与结果）`),
          {
            目标值: target,
            当前下标: i,
            'a[i]': i >= 0 && i <= n ? String(values[i] === '' ? '空' : values[i]) : '—',
            比较次数: comparisons,
          },
          caption,
        ),
      );
    };

    push('build', '建表', `把 ${n} 个元素依次存入 a[1] 到 a[${n}]，a[0] 空出来留给哨兵。`);
    values[0] = target;
    states.a0 = 'insert';
    push('sentinel', '设置哨兵', `a[0] = ${target}。它是哨兵，不是真实数据，只用来让循环自动停下。`);

    states.a0 = 'default';
    i = n;
    states[`a${i}`] = 'active';
    push('init', '指针初始化', `令 i = ${n}，从表尾开始往前逐个比较。`);

    while (i > 0) {
      states[`a${i}`] = 'compare';
      comparisons += 1;
      push('loop', '比较 a[i]', `比较 a[${i}] = ${data[i - 1]} 与目标 ${target}：${data[i - 1] === target ? '相等，命中' : '不相等，继续往前'}。`);
      if (data[i - 1] === target) break;
      states[`a${i}`] = 'visited';
      i -= 1;
      if (i > 0) states[`a${i}`] = 'active';
      push('move', 'i 后退一位', `未命中，执行 i-- ，i 变成 ${i}${i === 0 ? '，指向哨兵' : `，指向 ${data[i - 1]}`}。`);
    }

    if (i > 0) {
      states[`a${i}`] = 'found';
      push('ret', '查找成功', `命中位置是 a[${i}]，共比较 ${comparisons} 次，返回下标 ${i}。`);
    } else {
      comparisons += 1;
      states.a0 = 'compare';
      push('loop', '与哨兵比较', `i = 0，a[0] 是哨兵，值与目标相同，循环在这里自动停下，不需要额外判越界。`);
      states.a0 = 'delete';
      push('ret', '查找失败', `返回下标 0，说明整张表都没有 ${target}，共比较 ${comparisons} 次。`);
    }

    return steps.slice(0, 300);
  },
};
