import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

export const factorial: AlgorithmMeta = {
  slug: 'recursion/factorial',
  title: '递归 · 求阶乘',
  chapter: '第 5 章 递归',
  category: 'ch5',
  summary: 'fact(n) 逐层压栈，回溯时逐层相乘。',
  complexity: { time: 'O(n)', space: 'O(n)', extra: '递归深度 n，调用栈占 n 层' },
  difficulty: '入门',
  inputHint: '输入一个整数 n（3–8），演示 n! 的递归求解与调用栈的进出。',
  defaultInput: [5],
  input: { min: 3, max: 8, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'long long Fact(int n) {', anchor: 'enter' },
      { text: '  if (n == 0) return 1;', anchor: 'base' },
      { text: '  long long f = Fact(n - 1);', anchor: 'call' },
      { text: '  return n * f;', anchor: 'mul' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  std::cout << Fact(5);', anchor: 'done' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'def fact(n):', anchor: 'enter' },
      { text: '    if n == 0:', anchor: 'base' },
      { text: '        return 1' },
      { text: '    f = fact(n - 1)', anchor: 'call' },
      { text: '    return n * f', anchor: 'mul' },
      { text: 'print(fact(5))', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '阶乘的递归定义是 fact(n) = n × fact(n-1)，出口为 fact(0) = 1。求解时先一层层向下把问题化小（压栈），到达出口后再一层层把结果乘回去（弹栈）。所以递归的执行顺序是「先递后归」，返回值的方向与调用方向正好相反。',
      points: [
        '递归必须同时具备「递推关系」和「终止条件」，缺一个就会无限递归',
        '每层调用都有独立的局部变量 n 和 f，互不影响',
        '递归深度为 n+1（含 fact(0)），空间复杂度不是 O(1)',
      ],
    },
    {
      heading: '为什么必须回溯相乘',
      body: 'fact(5) 自己算不出结果，它把问题交给 fact(4) 后原地等待；fact(4) 又等 fact(3)……直到 fact(0) 直接返回 1。这个 1 被逐层乘上 1、2、3、4、5 才得到 120。观察调用栈面板，可以看到同一时刻栈里存活的调用正好是「还没算完」的那几层。',
      points: ['函数返回时栈帧被销毁，本层的值只能靠返回值传给上一层', '递归写法的简洁以额外的栈空间为代价，深度过大会栈溢出'],
    },
    {
      heading: '复杂度与易错点',
      body: '时间上每层只做一次乘法，共 n 层，O(n)；空间上调用栈深 n+1，O(n)。常见错误是忘记写终止条件、把 n-1 写成 n（死递归），以及用 int 存结果导致 13! 之后溢出，应改用 long long。',
    },
  ],
  quiz: [
    { q: '阶乘递归的终止条件通常是？', options: ['n == 1 时返回 n', 'n == 0 时返回 1', 'n < 0 时返回 0', '不需要终止条件'], answer: 1, explain: 'fact(0) = 1 是最小的已知结果，用它作为出口最简洁。' },
    { q: 'fact(5) 的调用栈最深有几层？', options: ['5 层', '6 层', '4 层', '1 层'], answer: 1, explain: 'fact(5) 到 fact(0) 共 6 层调用同时存在。' },
    { q: '递归求阶乘的空间复杂度是？', options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'], answer: 1, explain: '每层调用占一个栈帧，深度为 n+1，故为 O(n)。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const n = Math.min(Math.max(Math.trunc(input[0] || 5), 3), 8);
    const vals = Array.from({ length: n + 1 }, (_, x) => n - x);
    const states: Record<string, NodeState> = {};
    let t = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      stack: string[],
      cur: number | null,
      extra: Record<string, string | number> = {},
    ) => {
      const nodes = vals.map((v) => node(`f${v}`, v, v === cur ? 'active' : states[`f${v}`] ?? 'default'));
      const pointers: ScenePointer[] = cur === null ? [] : [{ label: 'n', index: n - cur }];
      steps.push(
        makeStep(
          t++,
          anchor,
          phase,
          arrayScene(nodes, pointers, undefined, `每格代表一层调用：fact(n)、fact(n-1) … fact(0)`),
          {
            当前n: cur === null ? '—' : cur,
            递归深度: stack.length,
            返回值: extra['返回值'] ?? '—',
            栈顶: stack.length ? stack[stack.length - 1] : '空',
          },
          caption,
          stack.length ? [...stack] : undefined,
        ),
      );
    };

    const rec = (x: number, stack: string[]): number => {
      stack.push(`fact(${x})`);
      states[`f${x}`] = 'active';
      push(
        'enter',
        '压栈',
        x === 0
          ? '调用 fact(0)：这是最后一层，直接检查递归出口。'
          : `调用 fact(${x})，本层进栈后原地等待 fact(${x - 1}) 的结果。`,
        stack,
        x,
      );

      if (x === 0) {
        stack[stack.length - 1] = 'fact(0) = 1';
        states['f0'] = 'sorted';
        push('base', '递归出口', 'n = 0，满足终止条件，不再递归，直接返回 1。', stack, x, { 返回值: 1 });
        stack.pop();
        return 1;
      }

      push('call', '递归调用', `fact(${x}) 依赖 fact(${x - 1})：先递归深入，本层的 n = ${x} 留在栈中。`, stack, x);
      const v = rec(x - 1, stack);
      const r = x * v;
      stack[stack.length - 1] = `fact(${x}) = ${r}`;
      states[`f${x}`] = 'sorted';
      push(
        'mul',
        '返回相乘',
        `fact(${x - 1}) 返回 ${v}，本层执行 ${x} × ${v} = ${r}，把结果返回上一层。`,
        stack,
        x,
        { 返回值: r },
      );
      stack.pop();
      return r;
    };

    const result = rec(n, []);
    push('done', '完成', `调用栈已全部清空，fact(${n}) = ${result}，递归求解结束。`, [], null, { 返回值: result });
    return steps;
  },
};
