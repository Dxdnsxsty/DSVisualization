import type { AlgorithmMeta, NodeState, SceneNode, TraceStep } from '../../engine/types';
import { gridScene, makeStep, node } from '../../engine/scene';

const M = 11;
const DEFAULT = [22, 41, 53, 46, 30, 30];

/** 哈希表（线性探测）：H(key) = key % 11，冲突就顺延到下一个空槽。 */
export const hashLinear: AlgorithmMeta = {
  slug: 'search/hash-linear',
  title: '哈希表 · 线性探测法',
  chapter: '第 9 章 查找',
  category: 'ch9',
  summary: '取模定址，冲突就向后找空槽。',
  complexity: { time: 'O(1)', space: 'O(m)', extra: '冲突时探测长度取决于堆积程度，最坏 O(m)' },
  difficulty: '进阶',
  inputHint: `输入若干整数：最后一个数是查找目标，前面的数依次插入长度为 ${M} 的哈希表，H(key) = key % ${M}。`,
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 12 },
  code: {
    cpp: [
      { text: '// 表长 m = 11，H(key) = key % 11，空槽记 -1', anchor: 'build' },
      { text: 'void Insert(int H[], int key) {' },
      { text: '  int p = key % 11;', anchor: 'hash' },
      { text: '  while (H[p] != -1) {', anchor: 'cmp' },
      { text: '    p = (p + 1) % 11;', anchor: 'probe' },
      { text: '  }' },
      { text: '  H[p] = key;', anchor: 'place' },
      { text: '}' },
      { text: 'int Search(int H[], int key) {' },
      { text: '  int p = key % 11;', anchor: 'shash' },
      { text: '  while (H[p] != -1) {', anchor: 'scmp' },
      { text: '    if (H[p] == key) return p;', anchor: 'found' },
      { text: '    p = (p + 1) % 11;', anchor: 'sprobe' },
      { text: '  }' },
      { text: '  return -1;', anchor: 'fail' },
      { text: '}' },
    ],
    python: [
      { text: '# 表长 m = 11，H(key) = key % 11，空槽记 None', anchor: 'build' },
      { text: 'def insert(H, key):' },
      { text: '    p = key % 11', anchor: 'hash' },
      { text: '    while H[p] is not None:', anchor: 'cmp' },
      { text: '        p = (p + 1) % 11', anchor: 'probe' },
      { text: '    H[p] = key', anchor: 'place' },
      { text: 'def search(H, key):' },
      { text: '    p = key % 11', anchor: 'shash' },
      { text: '    while H[p] is not None:', anchor: 'scmp' },
      { text: '        if H[p] == key:', anchor: 'found' },
      { text: '            return p' },
      { text: '        p = (p + 1) % 11', anchor: 'sprobe' },
      { text: '    return -1', anchor: 'fail' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '哈希表用关键字直接算出存储地址：H(key) = key % 11。理想情况下一次就能定位，查找、插入都是 O(1)。但不同的 key 可能算出同一个地址（冲突），线性探测的做法是：该槽位被占就顺序看下一个槽位，走到表尾再回到表头（循环探测），直到找到空槽。',
      points: [
        '插入时探测到空槽就落位；查找时探测到空槽就说明元素不存在',
        '查找不能中途停下，因为冲突的元素可能被挤到后面很远',
        '删除不能直接把槽位置空，否则会截断后续元素的探测链，通常用删除标记',
      ],
    },
    {
      heading: '堆积现象',
      body: '线性探测会把连续占用的小区间越连越长，新元素只要落进这段区间就要一路往后挪，这种现象叫"堆积"。装载因子 α = 元素个数 / 表长越大，平均探测长度增长越快，因此实际使用时要保证 α 不超过 0.75 左右。',
    },
    {
      heading: '对比其他冲突处理',
      body: '除线性探测外，还有二次探测（跳跃式探测，缓解一次堆积）、链地址法（同义词挂成链表，删除方便）。线性探测的优点是实现简单、缓存友好，缺点是删除麻烦、堆积明显。',
    },
  ],
  quiz: [
    { q: 'H(key) = key % 11，H(46) 等于？', options: ['2', '3', '4', '46'], answer: 0, explain: '46 = 4 × 11 + 2，所以 H(46) = 2。' },
    { q: '线性探测查找时，遇到空槽说明？', options: ['继续向后找', '查找失败', '从头再找一遍', '表中元素已满'], answer: 1, explain: '按探测序列，元素若在表中一定会出现在空槽之前，遇到空槽即可判定不存在。' },
    { q: '删除哈希表中的元素时为什么不能直接置空？', options: ['会浪费空间', '会截断探测链，导致后面的元素查不到', '会破坏哈希函数', '不允许删除'], answer: 1, explain: '置空后查找会在该位置误判"不存在"，所以要用删除标记保留探测链。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const list = raw.length >= 2 ? raw.slice(0, 9) : DEFAULT;
    const target = list[list.length - 1];
    const keys = list.slice(0, -1);
    const table: (number | null)[] = Array(M).fill(null);
    const steps: TraceStep[] = [];
    let k = 0;
    let currentKey: number | null = null;
    let hashAddr = 0;
    let probes = 0;
    let filled = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      p: number | null,
      hl: Record<number, NodeState> = {},
      note?: string,
    ) => {
      const nodes: SceneNode[] = table.map((v, i) => node(`h${i}`, v === null ? '' : String(v), hl[i] ?? 'default'));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          gridScene(
            nodes,
            M,
            p === null ? [] : [{ label: 'p', index: p }],
            note ?? `H(key) = key % ${M}　已存 ${filled} 个　装载因子 ${(filled / M).toFixed(2)}`,
          ),
          {
            关键字: currentKey === null ? '—' : currentKey,
            散列地址: currentKey === null ? '—' : hashAddr,
            探测次数: probes,
            已存元素: filled,
          },
          caption,
        ),
      );
    };

    push('build', '建表', `建立长度为 ${M} 的哈希表，全部槽位置空，哈希函数 H(key) = key % ${M}。`, null);

    for (const key of keys) {
      currentKey = key;
      probes = 0;
      let p = key % M;
      hashAddr = p;
      push('hash', '计算散列地址', `插入 ${key}：${key} % ${M} = ${p}，从槽位 ${p} 开始探测。`, p);

      let guard = 0;
      while (table[p] !== null && guard < M) {
        guard += 1;
        probes += 1;
        push('cmp', '槽位已被占用', `槽位 ${p} 已存放 ${table[p]}，与 ${key} 冲突，不能直接放入。`, p, { [p]: 'compare' });
        p = (p + 1) % M;
        push('probe', '线性探测下一个', `p = (p + 1) % ${M} = ${p}，顺延到下一个槽位继续找。`, p);
      }

      if (table[p] === null) {
        table[p] = key;
        filled += 1;
        push('place', '写入空槽', `槽位 ${p} 为空，把 ${key} 存进去，本次共探测 ${probes} 次。`, p, { [p]: 'insert' });
      }
    }

    const okTarget = keys.includes(target) ? target : keys[keys.length - 1];
    let miss = target + M;
    while (keys.includes(miss)) miss += M;

    const search = (key: number, label: string) => {
      currentKey = key;
      probes = 0;
      let p = key % M;
      hashAddr = p;
      push('shash', `计算散列地址（${label}）`, `查找 ${key}：${key} % ${M} = ${p}，从槽位 ${p} 开始探测。`, p);

      let guard = 0;
      while (table[p] !== null && guard < M) {
        guard += 1;
        probes += 1;
        if (table[p] === key) {
          push('scmp', '比较槽位关键字', `槽位 ${p} 存放的是 ${key}，与目标相等，命中。`, p, { [p]: 'found' });
          push('found', '查找成功', `${key} 位于槽位 ${p}，共探测 ${probes} 次。`, p, { [p]: 'found' });
          return;
        }
        push('scmp', '比较槽位关键字', `槽位 ${p} 存放的是 ${table[p]}，不等于 ${key}，不能停，继续往后探测。`, p, { [p]: 'compare' });
        p = (p + 1) % M;
        push('sprobe', '继续探测', `p 移到槽位 ${p}，沿探测序列继续比较。`, p);
      }

      push('fail', '查找失败', `槽位 ${p} 为空，说明 ${key} 不在表中，查找失败，共探测 ${probes} 次。`, p, { [p]: 'delete' });
    };

    search(okTarget, '成功查找');
    search(miss, '失败查找');
    return steps.slice(0, 300);
  },
};
