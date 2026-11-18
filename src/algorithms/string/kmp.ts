import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { decodeMatchInput, STRING_MATCH_INPUT as SPEC, validateInput } from '../../engine/input';
import { auxStruct, gridScene, makeStep, node, stringMatchScene } from '../../engine/scene';

/** 输入约定：第 1 个数是模式串长度 m，接着是主串字符，最后 m 个数是模式串；1–26 映射为 a–z。 */
const FALLBACK = [5, 1, 2, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1, 2, 3];
const show = (v: number | null): string | number => (v === null ? '·' : v);

export const kmpMatch: AlgorithmMeta = {
  slug: 'string/kmp',
  title: '串 · KMP 模式匹配',
  chapter: '第 4 章 串',
  category: 'ch4',
  summary: '失配时 j 跳到 next[j]，主串指针不回退。',
  complexity: { time: 'O(n+m)', space: 'O(m)', extra: 'next 数组占 m 个单元' },
  difficulty: '进阶',
  inputHint: '直接输入连续小写英文字母。主串 2–13 个字符，模式串 1–5 个字符。',
  defaultInput: [5, 1, 2, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1, 2, 3],
  input: SPEC,
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'void GetNext(char T[], int m, int next[]) {' },
      { text: '  int i = 0, j = -1;' },
      { text: '  next[0] = -1;', anchor: 'initNext' },
      { text: '  while (i < m - 1) {' },
      { text: '    if (j == -1 || T[i] == T[j]) {', anchor: 'nextCmp' },
      { text: '      i++; j++; next[i] = j;', anchor: 'nextSet' },
      { text: '    } else {' },
      { text: '      j = next[j];', anchor: 'nextBack' },
      { text: '    }' },
      { text: '  }' },
      { text: '}' },
      { text: '// next 数组求完，进入匹配阶段', anchor: 'nextDone' },
      { text: 'int KMP(char S[], char T[], int n, int m, int next[]) {' },
      { text: '  int i = 0, j = 0;', anchor: 'kmpInit' },
      { text: '  while (i < n && j < m) {', anchor: 'kmpCmp' },
      { text: '    if (j == -1 || S[i] == T[j]) { i++; j++; }' },
      { text: '    else j = next[j];', anchor: 'kmpBack' },
      { text: '  }' },
      { text: '  if (j >= m) return i - j;', anchor: 'kmpFound' },
      { text: '  return -1;', anchor: 'kmpFail' },
      { text: '}' },
    ],
    python: [
      { text: 'def get_next(t):' },
      { text: '    m = len(t)' },
      { text: '    nxt = [-1] * m' },
      { text: '    i, j = 0, -1' },
      { text: '    nxt[0] = -1', anchor: 'initNext' },
      { text: '    while i < m - 1:' },
      { text: '        if j == -1 or t[i] == t[j]:', anchor: 'nextCmp' },
      { text: '            i += 1' },
      { text: '            j += 1' },
      { text: '            nxt[i] = j', anchor: 'nextSet' },
      { text: '        else:' },
      { text: '            j = nxt[j]', anchor: 'nextBack' },
      { text: '    return nxt' },
      { text: '# next 数组求完，进入匹配阶段', anchor: 'nextDone' },
      { text: 'def kmp(s, t, nxt):' },
      { text: '    i = 0', anchor: 'kmpInit' },
      { text: '    j = 0' },
      { text: '    while i < len(s) and j < len(t):', anchor: 'kmpCmp' },
      { text: '        if j == -1 or s[i] == t[j]:' },
      { text: '            i += 1' },
      { text: '            j += 1' },
      { text: '        else:' },
      { text: '            j = nxt[j]', anchor: 'kmpBack' },
      { text: '    if j >= len(t):' },
      { text: '        return i - j', anchor: 'kmpFound' },
      { text: '    return -1', anchor: 'kmpFail' },
    ],
  },
  doc: [
    {
      heading: '这个动画怎么看',
      body: '两段动画都用「上下两行」表达同一件事，只是比较的对象不同：第一段是模式串和自己的错位副本比（求 next），第二段是主串和模式串比（匹配）。行首的灰色空格表示错开了多少位——灰格右移，就是「错位量变大」。',
      points: [
        '第一段：上排是 T 本体，下排是 T 右移若干位后的副本；紫色段与它正下方的绿色段逐位相同，这一段长度就是 next 值',
        '第二段：上排是主串 S，下排是模式串 T；失配时下排整体右滑、上排不动',
        '两段都盯住同一个不变量：i 只往右走，从不回退',
      ],
    },
    {
      heading: '核心思想',
      body: 'BF 每失配一次就把主串指针退回去重比，浪费了已经比较过的信息。KMP 观察到：失配时主串已经匹配的那一段等于模式串的一个前缀，于是可以让模式串「自我滑动」到某个仍可能匹配的位置，主串指针 i 永不回退，只把 j 跳到 next[j]。整个匹配因此是线性的。',
      points: [
        'next[j] 的定义：T[0..j-1] 的最长相等真前缀与真后缀的长度（教材约定 next[0] = -1）',
        'j = next[j] 的物理含义：模式串右移 j - next[j] 位，前缀已经和主串对应位置重合',
        'j == -1 时表示模式串已退无可退，此时 i 前进一位、j 归 0',
      ],
    },
    {
      heading: 'next 数组怎么求',
      body: '求 next 就是「模式串跟自己的错位副本匹配」：i 扫描后缀、j 扫描前缀。把副本右移 i-j 位，让 T[j] 正好落在 T[i] 的正下方，两者相等就说明前后缀还能再延长一位，等就写入 next；不等就让 j 沿 next 回退，即把副本再往右推，试更短的重叠。',
      points: [
        'i 从 0 开始、j 从 -1 开始，所以第一个写入的是 next[1]',
        '每次相等后 i、j 同时加 1，再写 next[i] = j —— 注意写的是自增之后的 i',
        'next 只与模式串有关，与主串无关，可以预处理一次反复使用',
        '实际工程中常用 nextval（优化 next）：若回退后的字符和原字符相同，则继续回退',
      ],
    },
    {
      heading: '复杂度与易错点',
      body: '求 next O(m)，匹配 O(n)，总时间 O(n+m)，空间 O(m)。常见错误是把 next 的定义记成「包含自身的公共前后缀」，导致 next 值偏大、回退不到位；以及失配时忘记 j == -1 的特判，让 j 变成负数后访问越界。',
    },
  ],
  quiz: [
    { q: 'KMP 失配时主串指针 i 如何变化？', options: ['回退到 i-j+1', '不回退，只改 j', '回退到 0', '每次加 m'], answer: 1, explain: 'KMP 的核心优势就是 i 单调前进，只让 j 跳到 next[j]。' },
    { q: '模式串 "abcac" 的 next 数组（next[0] = -1）是？', options: ['[-1,0,0,0,1]', '[-1,0,1,2,0]', '[0,1,1,1,2]', '[-1,0,0,1,2]'], answer: 0, explain: '只有前缀 a 与后缀 a 相等，所以 next[4] = 1，其余都是 0。' },
    { q: 'KMP 的总时间复杂度是？', options: ['O(n×m)', 'O(n+m)', 'O(n²)', 'O(m²)'], answer: 1, explain: '求 next 为 O(m)，匹配为 O(n)，相加即 O(n+m)。' },
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
    const nextArr: (number | null)[] = Array.from({ length: m }, () => null);
    let k = 0;

    const nextAux = (hot: number) =>
      auxStruct(
        'next 数组（下标 0 起，从左到右）',
        nextArr.map((v, x) =>
          node(`nx${x}`, show(v), x === hot ? 'active' : v === null ? 'default' : 'sorted'),
        ),
        [],
        m,
      );

    // ── 第一阶段：求 next。上排 T 本体，下排 T 右移 i-j 位的副本，垂直对齐处即公共前后缀 ──
    const nextPush = (anchor: string, caption: string, a: number, b: number) => {
      const d = Math.max(a - b, 0); // 副本右移量
      const cols = Math.max(2, 2 * m - 1); // 固定画布宽度：上排不动，只有下排在滑，避免整体缩放抖动
      const pad = (id: string, count: number) =>
        Array.from({ length: Math.max(count, 0) }, (_, x) => node(`${id}${x}`, '', 'visited'));

      // 上排：T 本体（固定不动）　下排：前导填充 + T（随右移量 d 滑动）
      const top = [...T.map((c, x) => node(`p${x}`, c, 'default')), ...pad('tp', cols - m)];
      const bottom = [
        ...pad('bp', d),
        ...T.map((c, x) => node(`q${x}`, c, 'default')),
        ...pad('bq', cols - d - m),
      ];

      // 上排后缀段 [a-b, a)、下排前缀段 [0, b) 落在同样的列上，形成上下对照
      for (let x = Math.max(a - b, 0); x < a; x++) top[x].state = 'compare';
      for (let x = 0; x < b; x++) bottom[d + x].state = 'sorted';
      top[a].state = 'active';
      if (b >= 0) bottom[d + b].state = 'min';

      const pointers: ScenePointer[] = [{ label: 'i', index: a }];
      if (b >= 0) pointers.push({ label: 'j', index: cols + d + b });

      steps.push(
        makeStep(
          k++,
          anchor,
          '求 next',
          {
            ...gridScene(
              [...top, ...bottom],
              cols,
              pointers,
              `T = ${T.join('')}　上排固定不动，下排是 T 右移 ${d} 位的副本　紫色后缀与正下方的绿色前缀逐位相同`,
            ),
            aux: nextAux(a),
          },
          {
            i: a,
            j: b,
            右移位数: d,
            公共前后缀长度: Math.max(b, 0),
          },
          caption,
        ),
      );
    };

    nextArr[0] = -1;
    let a = 0;
    let b = -1;
    nextPush(
      'initNext',
      '先定下 next[0] = -1。接下来让模式串和「右移过的自己」逐位比较：i 扫后缀，j 扫前缀，j 从 -1（长度 0）开始。',
      a,
      b,
    );
    while (a < m - 1) {
      const eq = b === -1 || T[a] === T[b];
      const d = Math.max(a - b, 0);
      nextPush(
        'nextCmp',
        b === -1
          ? 'j = -1：前缀长度为 0，副本已经退到最右边，没有重叠部分可复用。直接让 i、j 加 1，从这里开始找第一个可能的前后缀。'
          : `副本右移 ${d} 位后，T[${b}] = ${T[b]} 正好落在 T[${a}] = ${T[a]} 的正下方：${
              eq ? '上下两个字符相同，前后缀可以再延长一位。' : '上下两个字符不同，这个长度不行，要让前缀缩短后重试。'
            }`,
        a,
        b,
      );
      if (eq) {
        const oldA = a;
        a += 1;
        b += 1;
        nextArr[a] = b;
        const pref = T.slice(0, b).join('');
        nextPush(
          'nextSet',
          b === 0
            ? `写入 next[${a}] = 0：T[0..${oldA}] 没有相等的前后缀，只能长度为 0。`
            : `前后缀同时延长：写入 next[${a}] = ${b}。含义是 T[0..${oldA}] 的最长相等前后缀长度为 ${b}，即前缀「${pref}」与后缀「${pref}」重合。`,
          a,
          b,
        );
      } else {
        const oldB = b;
        b = nextArr[b] === null ? -1 : (nextArr[b] as number);
        const nd = Math.max(a - b, 0);
        nextPush(
          'nextBack',
          `T[${a}] 与 T[${oldB}] 不等，查表得 next[${oldB}] = ${b}：前缀缩短到 ${Math.max(b, 0)} 位，副本整体右移 ${nd} 位，换一个更短的重叠位置再比。`,
          a,
          b,
        );
      }
    }
    nextPush(
      'nextDone',
      `next 求完：${nextArr.map(show).join(' ')}。它的含义是「匹配时若在 T[k] 失配，j 应当退到 next[k]」，接下来进入匹配阶段。`,
      a,
      b,
    );

    // 第二阶段：上排主串固定，下排模式串随对齐位置右移。
    let i = 0;
    let j = 0;
    let compares = 0;

    const matchPush = (
      anchor: string,
      caption: string,
      hotS: Record<number, NodeState> = {},
      hotT: Record<number, NodeState> = {},
    ) => {
      const offset = Math.max(j < 0 ? i + 1 : i - j, 0);
      const mainNodes = S.map((c, x) => node(`s${x}`, c, hotS[x] ?? 'default'));
      const patternNodes = T.map((c, x) => node(`t${x}`, c, hotT[x] ?? 'default'));

      steps.push(
        makeStep(
          k++,
          anchor,
          '匹配',
          {
            ...stringMatchScene(mainNodes, patternNodes, offset, i, j, `主串 ${main} · 模式串 ${pattern}`),
            aux: nextAux(j >= 0 ? j : 0),
          },
          {
            i,
            j,
            对齐位置: offset,
            比较次数: compares,
          },
          caption,
        ),
      );
    };

    matchPush(
      'kmpInit',
      'i = j = 0，两串首位对齐。盯住上排的 i：后面无论怎么失配，它都只往右走、绝不回头。',
    );
    let hit = false;
    while (i < n && j < m) {
      if (j >= 0) compares += 1;
      const eq = j === -1 || S[i] === T[j];
      matchPush(
        'kmpCmp',
        j < 0
          ? 'j = -1：模式串已退无可退，此时让 i 前进一位、j 归 0，模式串对齐到新的位置重新开始。'
          : `比较主串 S[${i}] = ${S[i]} 与模式串 T[${j}] = ${T[j]}：${eq ? '相等，i、j 一起后移，继续比下一位。' : '失配，i 原地不动，只让 j 跳到 next[j]。'}`,
        eq || j < 0 ? { [i]: 'compare' } : { [i]: 'delete' },
        j >= 0 ? { [j]: eq ? 'compare' : 'delete' } : {},
      );
      if (eq) {
        if (j === m - 1) {
          hit = true;
          break;
        }
        i += 1;
        j += 1;
      } else {
        const oldJ = j;
        const nj = nextArr[j] === null ? -1 : (nextArr[j] as number);
        if (nj < 0) {
          i += 1;
          j = 0;
        } else {
          j = nj;
        }
        matchPush(
          'kmpBack',
          `失配于 j = ${oldJ}，查表得 next[${oldJ}] = ${nj}：模式串右移 ${oldJ - Math.max(nj, 0)} 位，` +
            `${nj < 0 ? 'j 归 0、i 前进一位。' : `j 退到 ${nj}，而 i 仍停在 ${i}。`}`,
        );
      }
    }

    if (hit) {
      const start = i - j;
      const states: Record<number, NodeState> = {};
      for (let x = start; x < start + m; x++) states[x] = 'found';
      matchPush(
        'kmpFound',
        `模式串全部匹配，首次出现位置为 ${start}（主串第 ${start + 1} 位起），全程只比较 ${compares} 次。`,
        states,
      );
    } else {
      matchPush(
        'kmpFail',
        `i 走到主串末尾仍未匹配完模式串，主串中不存在该模式串，共比较 ${compares} 次。`,
      );
    }
    return steps;
  },
};
