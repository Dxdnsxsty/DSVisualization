import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

/** 数字编码：1=( 2=[ 3=] 4=) 5={ 6=}，方便用整数数组表达括号序列。 */
const MAP: Record<number, string> = { 1: '(', 2: '[', 3: ']', 4: ')', 5: '{', 6: '}' };
const OPEN = '([{';
const PAIR: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const HINT = '编码 1=( 2=[ 3=] 4=) 5={ 6=}';

export const bracketMatch: AlgorithmMeta = {
  slug: 'stack/bracket-match',
  title: '栈的应用 · 括号匹配',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: '左括号入栈，右括号与栈顶配对。',
  complexity: { time: 'O(n)', space: 'O(n)', extra: '最坏情况所有左括号都压栈' },
  difficulty: '入门',
  inputHint: '输入 2–8 个 1–6 的编码：1=( 2=[ 3=] 4=) 5={ 6=}，例如 1 2 3 4 5 6 表示 ( [ ] ) { }。',
  defaultInput: [1, 2, 3, 4, 5, 6],
  input: { min: 1, max: 6, minLen: 2, maxLen: 8 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#include <stack>' },
      { text: '#include <string>' },
      { text: 'bool Match(char left, char right) {' },
      { text: "  return (left == '(' && right == ')') || (left == '[' && right == ']') || (left == '{' && right == '}');" },
      { text: '}' },
      { text: 'bool BracketMatch(std::string s) {' },
      { text: '  std::stack<char> st;', anchor: 'init' },
      { text: '  for (int i = 0; i < (int)s.size(); i++) {', anchor: 'loop' },
      { text: "    if (s[i] == '(' || s[i] == '[' || s[i] == '{')" },
      { text: '      st.push(s[i]);', anchor: 'push' },
      { text: '    else if (st.empty())' },
      { text: '      return false;', anchor: 'empty' },
      { text: '    else if (!Match(st.top(), s[i]))' },
      { text: '      return false;', anchor: 'mismatch' },
      { text: '    else' },
      { text: '      st.pop();', anchor: 'pop' },
      { text: '  }' },
      { text: '  return st.empty();', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def match(left, right):' },
      { text: "    return (left == '(' and right == ')') or (left == '[' and right == ']') or (left == '{' and right == '}')" },
      { text: 'def bracket_match(s):' },
      { text: '    st = []', anchor: 'init' },
      { text: '    for i, ch in enumerate(s):', anchor: 'loop' },
      { text: "        if ch in '([{':" },
      { text: '            st.append(ch)', anchor: 'push' },
      { text: '        elif not st:' },
      { text: '            return False', anchor: 'empty' },
      { text: '        elif not match(st[-1], ch):' },
      { text: '            return False', anchor: 'mismatch' },
      { text: '        else:' },
      { text: '            st.pop()', anchor: 'pop' },
      { text: '    return not st', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '括号匹配的本质是「后遇到的左括号先被闭合」，正好是栈的后进先出。扫描序列：遇到左括号就压栈；遇到右括号则检查栈顶，若栈空说明右括号多余，若栈顶与它不配对说明交叉或错配，否则弹出栈顶表示这一对完成。扫描结束后栈必须为空，否则还有左括号没被闭合。',
      points: [
        '三种失败情形：右括号多余（栈空）、左右不配对、左括号多余（结束栈非空）',
        '栈里只需存左括号字符，不需要存下标，因为最终只看是否配平',
        '一定要先判空再取栈顶，否则空栈取 top 是非法访问',
      ],
    },
    {
      heading: '复杂度与易错点',
      body: '每个字符最多进出栈各一次，时间复杂度 O(n)；最坏情况（全是左括号）栈深为 n，空间 O(n)。常见错误是只统计左右括号数量是否相等——"( ]" 数量相等但并不合法，必须按配对关系判断。',
      points: ['配对函数要按三种括号分别判断，不能只比较「是不是右括号」', '扫描结束后忘记检查栈空，会漏判多余的左括号'],
    },
  ],
  quiz: [
    { q: '遇到右括号时应该做什么？', options: ['直接入栈', '与栈顶比较，配对则出栈', '清空栈', '与栈底比较'], answer: 1, explain: '右括号必须与最近的未闭合左括号（栈顶）配对。' },
    { q: '序列 "( [ ) ]" 的匹配结果是？', options: ['匹配成功', '在 ")" 处失配', '最后栈非空', '右括号多余'], answer: 1, explain: '遇到 ")" 时栈顶是 "[", 二者不配对，立即失败。' },
    { q: '扫描结束后栈为空说明？', options: ['右括号多余', '所有左括号都被闭合，匹配成功', '序列一定是回文', '一定有嵌套'], answer: 1, explain: '栈空意味着没有剩余未配对的左括号。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const valid = input.length >= 2 && input.every((v) => MAP[v] !== undefined);
    const seq = (valid ? input : [1, 2, 3, 4, 5, 6]).slice(0, 8).map((v) => MAP[v]);
    let k = 0;

    const scan = (chars: string[], prefix: string, phase: string, hint: string): boolean => {
      const stack: string[] = [];
      const ids = chars.map((_, i) => `${prefix}${i}`);
      const emit = (
        anchor: string,
        caption: string,
        pos: number | null,
        states: Record<string, NodeState> = {},
        extra: Record<string, string | number> = {},
      ) => {
        steps.push(
          makeStep(
            k++,
            anchor,
            phase,
            arrayScene(
              chars.map((c, i) => node(ids[i], c, states[ids[i]] ?? 'default')),
              [{ label: 'i', index: pos }],
              undefined,
              `栈：${stack.length ? stack.join(' ') : '空'}　${hint}`,
            ),
            {
              扫描位置: pos === null ? '—' : pos,
              栈深: stack.length,
              栈内容: stack.join('') || '空',
              ...extra,
            },
            caption,
          ),
        );
      };

      emit('init', `初始化空栈，准备从左到右扫描 ${chars.join('')}。`, null, {}, { 判定: '开始' });
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        emit('loop', `扫描到第 ${i} 个字符 ${ch}。`, i, { [ids[i]]: 'compare' }, { 当前字符: ch });
        if (OPEN.includes(ch)) {
          stack.push(ch);
          emit('push', `${ch} 是左括号，压入栈顶，等待配对的右括号。`, i, { [ids[i]]: 'insert' }, { 当前字符: ch, 判定: '入栈' });
        } else if (stack.length === 0) {
          emit('empty', `栈已空，${ch} 没有可以配对的左括号，匹配失败。`, i, { [ids[i]]: 'delete' }, { 当前字符: ch, 判定: '右括号多余' });
          return false;
        } else if (stack[stack.length - 1] !== PAIR[ch]) {
          emit(
            'mismatch',
            `栈顶是 ${stack[stack.length - 1]}，与 ${ch} 不配对（交叉或错配），匹配失败。`,
            i,
            { [ids[i]]: 'delete' },
            { 当前字符: ch, 判定: '不配对' },
          );
          return false;
        } else {
          const left = stack[stack.length - 1];
          stack.pop();
          emit('pop', `栈顶 ${left} 与 ${ch} 配对，弹出栈顶，这一对闭合。`, i, { [ids[i]]: 'found' }, { 当前字符: ch, 判定: '配对出栈' });
        }
      }
      if (stack.length === 0) {
        emit('done', '扫描结束且栈为空，所有括号都成对闭合，匹配成功。', null, {}, { 判定: '匹配成功' });
        return true;
      }
      emit('done', `扫描结束但栈中还剩 ${stack.join('')}，左括号多余，匹配失败。`, null, {}, { 判定: '左括号多余' });
      return false;
    };

    const ok = scan(seq, 'b', '扫描', HINT);
    if (ok) {
      scan(['(', '[', ')'], 'm', '反例演示', '反例序列 ( [ ) ：右括号与栈顶不配对');
    }
    return steps;
  },
};
