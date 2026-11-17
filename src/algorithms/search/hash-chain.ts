import type { AlgorithmMeta, NodeState, SceneNode, TraceStep } from '../../engine/types';
import { auxStruct, gridScene, makeStep, node } from '../../engine/scene';

const M = 7;
const DEFAULT = [15, 22, 8, 30, 9, 46, 53, 22];

/** 哈希表（拉链法）：H(key) = key % 7，同义词挂在同一个桶的链表上。 */
export const hashChain: AlgorithmMeta = {
  slug: 'search/hash-chain',
  title: '哈希表 · 拉链法',
  chapter: '第 9 章 查找',
  category: 'ch9',
  summary: '取模定桶，同义词在桶内挂成一条链。',
  complexity: { time: 'O(1)', space: 'O(n+m)', extra: '平均查找长度取决于链长，最坏退化为 O(n)' },
  difficulty: '进阶',
  inputHint: `输入若干整数：最后一个数是查找目标，前面的数依次插入长度为 ${M} 的哈希表，H(key) = key % ${M}，冲突时尾插到桶内链表。`,
  defaultInput: DEFAULT,
  input: { min: -999, max: 999, minLen: 2, maxLen: 14 },
  code: {
    cpp: [
      { text: '// 表长 7，H(key) = key % 7，桶内用单链表存同义词', anchor: 'init' },
      { text: 'Node *H[7] = {NULL};' },
      { text: 'void Insert(int key) {' },
      { text: '  int h = key % 7;', anchor: 'hash' },
      { text: '  Node *s = new Node{key, NULL};' },
      { text: '  if (H[h] == NULL) { H[h] = s; return; }', anchor: 'insert' },
      { text: '  Node *p = H[h];' },
      { text: '  while (p->next != NULL) p = p->next;', anchor: 'cmp' },
      { text: '  p->next = s;  // 尾插，保持插入顺序', anchor: 'append' },
      { text: '}' },
      { text: 'Node *Search(int key) {' },
      { text: '  int h = key % 7;', anchor: 'shash' },
      { text: '  for (Node *p = H[h]; p != NULL; p = p->next) {', anchor: 'scmp' },
      { text: '    if (p->key == key) return p;', anchor: 'found' },
      { text: '  }' },
      { text: '  return NULL;' },
      { text: '}' },
    ],
    python: [
      { text: '# 表长 7，H(key) = key % 7，桶内用 list 存同义词', anchor: 'init' },
      { text: 'H = [[] for _ in range(7)]' },
      { text: 'def insert(key):' },
      { text: '    h = key % 7', anchor: 'hash' },
      { text: '    if not H[h]:', anchor: 'insert' },
      { text: '        H[h].append(key)' },
      { text: '        return' },
      { text: '    for v in H[h]:  # 找到链尾', anchor: 'cmp' },
      { text: '        pass' },
      { text: '    H[h].append(key)  # 尾插，保持插入顺序', anchor: 'append' },
      { text: 'def search(key):' },
      { text: '    h = key % 7', anchor: 'shash' },
      { text: '    for v in H[h]:', anchor: 'scmp' },
      { text: '        if v == key:', anchor: 'found' },
      { text: '            return v' },
      { text: '    return None' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '拉链法把哈希表看成「桶数组 + 每桶一条链表」：先用 H(key) = key % 7 算出桶号，再把关键字挂到该桶的链表上。桶空时它就是表头；桶非空时沿链走到尾部插入，同义词自然形成一条链，不再需要往后找空槽。',
      points: [
        '冲突只在同一个桶内部发生，不会影响别的桶',
        '插入可以头插也可以尾插；尾插保持插入次序，头插更快',
        '查找时沿桶内链表逐个比较，链长就是该关键字的比较次数',
      ],
    },
    {
      heading: '与线性探测的对比',
      body: '线性探测把冲突元素挤到别的槽位，容易产生堆积，删除还要用删除标记；拉链法的同义词都在自己桶里，删除只需摘链，装载因子也可以大于 1。代价是要额外的指针空间，并且链表结点在内存中不连续，缓存不友好。',
    },
    {
      heading: '性能分析',
      body: '设表长 m、元素个数 n，装载因子 α = n/m。拉链法的平均查找长度约为 1 + α/2（成功）与 α（失败），只要 α 控制得当就是 O(1)。最坏情况是所有关键字落在同一个桶，退化成单链表查找 O(n)。',
      points: ['桶数通常取质数，能让取模后的分布更均匀', 'Java 的 HashMap 在链过长时会转成红黑树', '示例中 15、22、8 都落在桶 1，形成长度为 3 的链'],
    },
  ],
  quiz: [
    { q: 'H(key) = key % 7，示例中哪些关键字落在同一个桶？', options: ['15、22、8', '30、9', '46、53', '22、30'], answer: 0, explain: '三个数除以 7 的余数都是 1，因此都挂在桶 1 的链上。' },
    { q: '拉链法查找 22 时，需要比较几次？', options: ['1 次', '2 次', '3 次', '7 次'], answer: 1, explain: '桶 1 的链为 15 → 22 → 8，先比 15 不等，再比 22 命中，共 2 次。' },
    { q: '拉链法相比线性探测的主要优势是？', options: ['不需要哈希函数', '删除只需摘链，且不会产生堆积', '空间更省', '查找一定是 O(1)'], answer: 1, explain: '同义词各自成链，删除直接摘链即可，也不会把别的元素挤走形成堆积。' },
  ],
  generate: (input) => {
    const raw = input.filter((v) => Number.isFinite(v));
    const list = raw.length >= 2 ? raw.slice(0, 9) : DEFAULT;
    const target = list[list.length - 1];
    const keys = list.slice(0, -1).map((v) => Math.trunc(v));
    const table: number[][] = Array.from({ length: M }, () => []);
    const steps: TraceStep[] = [];
    let k = 0;
    let curKey: number | null = null;
    let h = 0;
    let compares = 0;
    let inserted = 0;
    let bucketStates: Record<number, NodeState> = {};
    let auxStates: Record<string, NodeState> = {};

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes = table.map((chain, i) =>
        node(`b${i}`, chain.length ? String(chain[0]) : '∧', bucketStates[i] ?? 'default', `桶${i}`),
      );
      const chain = table[h];
      const auxNodes: SceneNode[] = chain.map((key, idx) =>
        node(`c${idx}`, key, auxStates[`c${idx}`] ?? 'default'),
      );
      auxNodes.push(node('nil', '∧', 'default'));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...gridScene(
              nodes,
              M,
              curKey === null ? [] : [{ label: 'p', index: h }],
              `H(key) = key % ${M}　已存 ${inserted} 个　装载因子 ${(inserted / M).toFixed(2)}`,
            ),
            aux: auxStruct(`桶 ${h} 的链（表头 → 链尾）`, auxNodes),
          },
          {
            关键字: curKey === null ? '—' : curKey,
            散列地址: curKey === null ? '—' : h,
            桶内长度: chain.length,
            比较次数: compares,
            已存元素: inserted,
          },
          caption,
        ),
      );
    };

    push('init', '建表', `建立长度为 ${M} 的桶数组，每桶初始为空链，哈希函数 H(key) = key % ${M}。`);

    for (const key of keys) {
      curKey = key;
      h = ((key % M) + M) % M;
      compares = 0;
      bucketStates = { [h]: 'active' };
      auxStates = {};
      push('hash', '计算散列地址', `插入 ${key}：${key} % ${M} = ${h}，定位到桶 ${h}。`);

      const chain = table[h];
      if (chain.length === 0) {
        chain.push(key);
        inserted += 1;
        bucketStates = { [h]: 'insert' };
        push('insert', '挂入空桶', `桶 ${h} 为空，${key} 直接成为该桶链表的表头，不需要比较。`);
        continue;
      }

      for (let idx = 0; idx < chain.length; idx++) {
        compares += 1;
        const next: Record<string, NodeState> = {};
        for (let t = 0; t <= idx; t++) next[`c${t}`] = t === idx ? 'compare' : 'visited';
        auxStates = next;
        bucketStates = { [h]: 'active' };
        push(
          'cmp',
          '沿链走向链尾',
          `桶 ${h} 中已有 ${chain.length} 个同义词，${idx === 0 ? '从表头开始' : '沿链走到下一个结点'}：当前是 ${chain[idx]}，它不是链尾，继续往后走。`,
        );
      }

      chain.push(key);
      inserted += 1;
      bucketStates = { [h]: 'insert' };
      auxStates = { [`c${chain.length - 1}`]: 'insert' };
      push(
        'append',
        '挂到链尾',
        `走到尾结点 ${chain[chain.length - 2]}，把 ${key} 挂到它后面（尾插法，桶 ${h} 的链长变为 ${chain.length}）。`,
      );
    }

    const okTarget = keys.includes(Math.trunc(target)) ? Math.trunc(target) : keys[keys.length - 1];
    curKey = okTarget;
    h = ((okTarget % M) + M) % M;
    compares = 0;
    bucketStates = { [h]: 'active' };
    auxStates = {};
    push(
      'shash',
      '计算散列地址',
      `查找 ${okTarget}：${okTarget} % ${M} = ${h}，只需在桶 ${h} 的链表中查找。`,
    );

    const chain = table[h];
    let hit = -1;
    for (let idx = 0; idx < chain.length; idx++) {
      compares += 1;
      const next: Record<string, NodeState> = {};
      for (let t = 0; t < idx; t++) next[`c${t}`] = 'visited';
      if (chain[idx] === okTarget) {
        next[`c${idx}`] = 'found';
        auxStates = next;
        bucketStates = { [h]: 'visited' };
        push('found', '查找成功', `第 ${compares} 次比较：结点值 ${chain[idx]} 等于目标 ${okTarget}，查找成功。`);
        hit = idx;
        break;
      }
      next[`c${idx}`] = 'compare';
      auxStates = next;
      push('scmp', '比较不相等', `第 ${compares} 次比较：结点值 ${chain[idx]} ≠ ${okTarget}，沿链继续下一个。`);
    }

    if (hit < 0) {
      auxStates = {};
      bucketStates = { [h]: 'delete' };
      push('found', '查找失败', `走到链尾的 ∧ 仍未命中，说明 ${okTarget} 不在表中。`);
    }
    return steps;
  },
};
