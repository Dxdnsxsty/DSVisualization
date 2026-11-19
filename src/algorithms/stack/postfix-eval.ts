import type { AlgorithmMeta, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const postfixEval: AlgorithmMeta = {
  slug: 'stack/postfix-eval',
  title: '栈的应用 · 后缀表达式求值',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: '遇到操作数入栈，遇到运算符弹出两个数计算。',
  complexity: { time: 'O(n)', space: 'O(n)' },
  difficulty: '进阶',
  inputHint: '输入 3 个整数 a、b、c，演示 a + b × c 的后缀表达式 a b c × +。',
  defaultInput: [3, 4, 2],
  input: { min: -99, max: 99, minLen: 3, maxLen: 3 },
  code: {
    cpp: [
      { text: 'int Eval(Token exp[]) {', anchor: 'init' },
      { text: '  std::stack<int> st;' },
      { text: '  for (Token t : exp) {', anchor: 'loop' },
      { text: '    if (t.isNumber) st.push(t.value);', anchor: 'push' },
      { text: '    else {' },
      { text: '      int b = st.top(); st.pop();', anchor: 'pop' },
      { text: '      int a = st.top(); st.pop();' },
      { text: '      st.push(t.op(a, b));', anchor: 'calc' },
      { text: '    }' },
      { text: '  } return st.top();', anchor: 'done' },
      { text: '}' },
    ],
    python: [
      { text: 'def eval_postfix(exp):', anchor: 'init' },
      { text: '    st = []' },
      { text: '    for t in exp:', anchor: 'loop' },
      { text: '        if isinstance(t, int): st.append(t)', anchor: 'push' },
      { text: '        else:' },
      { text: '            b, a = st.pop(), st.pop()', anchor: 'pop' },
      { text: "            if t == '×': st.append(a * b)", anchor: 'calc' },
      { text: "            elif t == '+': st.append(a + b)" },
      { text: '    return st[-1]', anchor: 'done' },
    ],
  },
  doc: [{ heading: '核心思想', body: '后缀表达式不需要括号。扫描记号，数字压栈；运算符弹出右操作数 b 和左操作数 a，计算后再压栈。', points: ['弹栈顺序不能反', '每个记号只扫描一次'] }],
  quiz: [{ q: '处理减法运算符时先弹出的数是？', options: ['右操作数', '左操作数', '结果', '栈底'], answer: 0, explain: '栈顶是后读入的右操作数 b，计算 a-b。' }],
  generate: (input) => {
    const tokens = [String(input[0]), String(input[1]), String(input[2]), '×', '+'];
    const stack: number[] = [];
    const steps: TraceStep[] = [];
    const push = (anchor: string, caption: string, pos: number, operands: Record<string, number> = {}) => {
      steps.push(makeStep(
        steps.length, anchor, '求值',
        {
          ...arrayScene(tokens.map((value, i) => node(`t${i}`, value, i === pos ? 'active' : 'default')),
            [{ label: '当前记号', index: pos }]),
          aux: {
            label: '操作数栈', layout: 'stack',
            nodes: Array.from({ length: 3 }, (_, i) => node(`s${i}`, stack[i] ?? '',
              i === stack.length - 1 && (anchor === 'push' || anchor === 'calc') ? 'insert' : 'default')),
            pointers: [{ label: 'top', index: stack.length ? stack.length - 1 : null }],
          },
        },
        { 栈: stack.join(' ') || '空', ...operands }, caption,
      ));
    };
    push('init', '准备扫描后缀表达式。', 0);
    input.slice(0, 3).forEach((value, i) => {
      stack.push(value);
      push('push', `${value} 是操作数，压栈。`, i);
    });
    for (const position of [3, 4]) {
      const right = stack.pop()!;
      const left = stack.pop()!;
      const operands = { 左操作数: left, 右操作数: right };
      push('pop', `遇到 ${tokens[position]}，先弹出右操作数 ${right}，再弹出左操作数 ${left}。`, position, operands);
      const result = position === 3 ? left * right : left + right;
      stack.push(result);
      push('calc', `${left} ${tokens[position]} ${right} = ${result}，结果压入栈顶。`, position, operands);
    }
    push('done', `栈中唯一元素 ${stack[0]} 就是表达式值。`, 4);
    return steps;
  },
};
