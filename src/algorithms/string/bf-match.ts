import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { decodeMatchInput, STRING_MATCH_INPUT as SPEC, validateInput } from '../../engine/input';
import { makeStep, node, stringMatchScene } from '../../engine/scene';

/** 输入约定：第 1 个数是模式串长度 m，接着是主串字符，最后 m 个数是模式串；1–26 映射为 a–z。 */
const FALLBACK = [5, 1, 2, 1, 2, 3, 1, 2, 3, 1, 3, 2, 1, 2, 1, 2, 3, 1, 3];

export const bfMatch: AlgorithmMeta = {
  slug: 'string/bf-match',
  title: '串 · BF 朴素模式匹配',
  chapter: '第 4 章 串',
  category: 'ch4',
  summary: '失配后 i 回退到 i-j+1，模式串右移一位。',
  complexity: { time: 'O(n×m)', space: 'O(1)', extra: 'n 为主串长，m 为模式串长' },
  difficulty: '入门',
  inputHint: '直接输入连续小写英文字母。主串 2–13 个字符，模式串 1–5 个字符。',
  defaultInput: [5, 1, 2, 1, 2, 3, 1, 2, 3, 1, 3, 2, 1, 2, 1, 2, 3, 1, 3],
  input: SPEC,
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'int BF(char S[], char T[], int n, int m) {' },
      { text: '  int i = 0, j = 0;', anchor: 'init' },
      { text: '  while (i < n && j < m) {', anchor: 'loop' },
      { text: '    if (S[i] == T[j]) {' },
      { text: '      i++; j++;', anchor: 'cmp' },
      { text: '    } else {' },
      { text: '      i = i - j + 1;', anchor: 'back' },
      { text: '      j = 0;' },
      { text: '    }' },
      { text: '  }' },
      { text: '  if (j >= m) return i - j;', anchor: 'found' },
      { text: '  return -1;', anchor: 'fail' },
      { text: '}' },
    ],
    python: [
      { text: 'def bf_match(s, t):' },
      { text: '    i = 0', anchor: 'init' },
      { text: '    j = 0' },
      { text: '    while i < len(s) and j < len(t):', anchor: 'loop' },
      { text: '        if s[i] == t[j]:' },
      { text: '            i += 1' },
      { text: '            j += 1', anchor: 'cmp' },
      { text: '        else:' },
      { text: '            i = i - j + 1', anchor: 'back' },
      { text: '            j = 0' },
      { text: '    if j >= len(t):' },
      { text: '        return i - j', anchor: 'found' },
      { text: '    return -1', anchor: 'fail' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '朴素匹配（BF，Brute Force）把模式串 T 从主串 S 的每个位置依次对齐，逐位比较；一旦失配，就让主串指针回退到本次对齐起点的下一个位置，模式串指针归零，再重新对齐。穷举所有可能的起点，因此正确性很直观，但效率低。',
      points: [
        'i 表示主串当前比较位置，j 表示模式串当前比较位置',
        '失配时 i 回退到 i-j+1：i-j 是本次对齐的起点，加 1 即右移一位',
        '循环结束后 j == m 说明匹配成功，首次出现位置是 i-j',
      ],
    },
    {
      heading: '复杂度与易错点',
      body: '最好情况第一趟就匹配，比较 m 次，O(m)；最坏情况每趟都在最后一个字符失配，比较 (n-m+1)×m 次，O(n×m)。空间只用了 i、j 两个变量，O(1)。',
      points: [
        '回退公式写成 i = i-j+2 会跳过起点，导致漏解',
        '忘记在失配时把 j 置 0，会让模式串错位继续比较',
        '循环条件要同时判断 i < n 与 j < m，只判一个会越界',
      ],
    },
  ],
  quiz: [
    { q: 'BF 算法失配后主串指针如何移动？', options: ['i 保持不变', 'i 回退到 i-j+1', 'i 回退到 0', 'i 加 m'], answer: 1, explain: '本次对齐起点是 i-j，右移一位即 i-j+1。' },
    { q: 'BF 算法的最坏时间复杂度是？', options: ['O(n+m)', 'O(n×m)', 'O(n)', 'O(m²)'], answer: 1, explain: '每个起点都可能比较 m 次，最坏共约 (n-m+1)×m 次。' },
    { q: '循环结束时判断匹配成功的条件是？', options: ['i >= n', 'j >= m', 'i == j', 'j == 0'], answer: 1, explain: 'j 走完模式串说明整串都比对成功。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    // 与 UI 校验共用同一条规则：不存在「校验通过但生成器回退默认串」的缝隙
    const src = validateInput(SPEC, input) ? FALLBACK : input;
    const [main, pattern] = decodeMatchInput(src);
    const S = [...main];
    const T = [...pattern];
    const m = T.length;
    const n = S.length;
    let i = 0;
    let j = 0;
    let compares = 0;
    let k = 0;

    const push = (anchor: string, phase: string, caption: string, states: Record<string, NodeState> = {}) => {
      const mainNodes = S.map((c, x) => node(`s${x}`, c, states[`s${x}`] ?? 'default'));
      const patternNodes = T.map((c, x) => node(`t${x}`, c, states[`t${x}`] ?? 'default'));
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          stringMatchScene(mainNodes, patternNodes, i - j, i, j, `主串 ${main} · 模式串 ${pattern}`),
          { i, j, 比较次数: compares, 主串长: n, 模式长: m },
          caption,
        ),
      );
    };

    push('init', '初始化', `主串长 ${n}，模式串长 ${m}，i 与 j 都从 0 开始，把模式串对齐到主串开头。`);
    let found = false;
    while (i < n && j < m) {
      compares += 1;
      const equal = S[i] === T[j];
      push(
        'cmp',
        '逐位比较',
        `比较 S[${i}] = ${S[i]} 与 T[${j}] = ${T[j]}：${equal ? '相等，两指针一起后移。' : '失配，需要回退。'}`,
        { [`s${i}`]: 'compare', [`t${j}`]: 'compare' },
      );
      if (equal) {
        if (j === m - 1) {
          found = true;
          break;
        }
        i += 1;
        j += 1;
      } else {
        const oldI = i;
        const oldJ = j;
        i = i - j + 1;
        j = 0;
        push('back', '失配回退', `i 从 ${oldI} 退到 i-j+1 = ${oldI}-${oldJ}+1 = ${i}，j 归 0，模式串整体右移一位后重新比较。`);
        if (i > n - m) break;
      }
    }

    if (found) {
      const start = i - j;
      const states: Record<string, NodeState> = {};
      for (let x = start; x < start + m; x++) states[`s${x}`] = 'found';
      push('found', '匹配成功', `T 每一位都匹配，首次出现位置是 ${start}（从 0 计数），共比较 ${compares} 次。`, states);
    } else {
      push('fail', '匹配失败', `i 已超过 n-m = ${n - m}，剩余长度不足，主串中不存在模式串，共比较 ${compares} 次。`);
    }
    return steps;
  },
};
