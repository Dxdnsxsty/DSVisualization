import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

const CAP = 6;
/** 为了演示「栈满上溢」，入栈阶段结束前用这几个补充元素把栈填满。 */
const FILL = [7, 8, 9];

export const seqStack: AlgorithmMeta = {
  slug: 'stack/seq-stack',
  title: '顺序栈 · 入栈与出栈',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: 'top 指向栈顶，观察上溢与下溢的判定。',
  complexity: { time: 'O(1)', space: 'O(1)', extra: '入栈出栈都只改 top，不移动元素' },
  difficulty: '入门',
  inputHint: '输入 3 个整数，依次入栈；随后演示填满上溢、出栈 2 个、清空下溢。',
  defaultInput: [3, 8, 5],
  input: { min: -999, max: 999, minLen: 3, maxLen: 3 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define MAXSIZE 6' },
      { text: 'typedef struct { int data[MAXSIZE]; int top; } SqStack;' },
      { text: 'void InitStack(SqStack &S) {' },
      { text: '  S.top = -1;', anchor: 'init' },
      { text: '}' },
      { text: 'bool Push(SqStack &S, int x) {' },
      { text: '  if (S.top == MAXSIZE - 1) return false;', anchor: 'full' },
      { text: '  S.data[++S.top] = x;', anchor: 'push' },
      { text: '  return true;' },
      { text: '}' },
      { text: 'bool Pop(SqStack &S, int &x) {' },
      { text: '  if (S.top == -1) return false;', anchor: 'empty' },
      { text: '  x = S.data[S.top--];', anchor: 'pop' },
      { text: '  return true;' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  // 入栈、出栈，观察 top 的加减', anchor: 'done' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'MAXSIZE = 6' },
      { text: 'class SqStack:' },
      { text: '    def __init__(self):' },
      { text: '        self.data = [0] * MAXSIZE' },
      { text: '        self.top = -1', anchor: 'init' },
      { text: '    def push(self, x):' },
      { text: '        if self.top == MAXSIZE - 1: return False', anchor: 'full' },
      { text: '        self.top += 1' },
      { text: '        self.data[self.top] = x', anchor: 'push' },
      { text: '        return True' },
      { text: '    def pop(self):' },
      { text: '        if self.top == -1: return False', anchor: 'empty' },
      { text: '        x = self.data[self.top]' },
      { text: '        self.top -= 1', anchor: 'pop' },
      { text: '        return x' },
      { text: 's = SqStack()' },
      { text: '# 入栈、出栈，观察 top 的加减', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '顺序栈用一段连续数组加一个栈顶指针 top 实现。top 不是「元素个数」，而是栈顶元素的下标：空栈时 top = -1，入栈先让 top 加 1 再写入，出栈先取值再让 top 减 1。所有操作都只改 top，因此入栈出栈都是 O(1)。',
      points: [
        '空栈条件是 top == -1，栈满条件是 top == MAXSIZE-1',
        '入栈必须先判满，否则会越界写；出栈必须先判空，否则会读到垃圾值',
        '栈长等于 top + 1，容量是数组长度，两者不要混用',
      ],
    },
    {
      heading: '上溢与下溢',
      body: '栈满时再入栈称为上溢（overflow），栈空时再出栈称为下溢（underflow）。这两种情况在顺序栈里都是「越界」错误，必须由调用方在操作前判断，函数本身通常返回 false 表示失败。',
      points: ['顺序栈的容量是编译期固定的，上溢无法靠扩容解决', '链栈不会上溢，但每个结点要多花一个指针的空间'],
    },
  ],
  quiz: [
    { q: '顺序栈空栈时 top 的值是？', options: ['0', '-1', '1', 'MAXSIZE'], answer: 1, explain: 'top 是栈顶元素的下标，空栈没有元素，所以 top = -1。' },
    { q: '入栈操作的正确顺序是？', options: ['先写 data[top]，再 top++', '先 top++，再写 data[top]', '先 top--，再写 data[top]', '直接写 data[top+1]'], answer: 1, explain: 'top 指向栈顶元素，必须先上移一格腾出位置，再写入新元素。' },
    { q: '栈满后继续入栈会发生什么？', options: ['自动扩容', '覆盖栈底元素', '上溢，操作失败', '下溢，操作失败'], answer: 2, explain: '顺序栈容量固定，top 已达 MAXSIZE-1 时再入栈即上溢。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const ok = input.length >= 3 && input.slice(0, 3).every((v) => Number.isFinite(v));
    const vals = (ok ? input : [3, 8, 5]).slice(0, 3).map((v) => Math.abs(Math.trunc(v)) % 100);
    const data: (number | null)[] = Array.from({ length: CAP }, () => null);
    let top = -1;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState> = {},
      extra: Record<string, string | number> = {},
    ) => {
      const pointers: ScenePointer[] = [
        { label: top < 0 ? 'top=-1' : 'top', index: top < 0 ? null : top },
      ];
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...arrayScene(
              Array.from({ length: CAP }, (_, i) => node(`s${i}`, data[i] ?? '', states[i] ?? 'default')),
              pointers,
              CAP,
              `top = ${top} · 栈长 ${top + 1} / 容量 ${CAP}`,
            ),
            layout: 'stack',
          },
          { 栈顶: top, 栈长: top + 1, 容量: CAP, ...extra },
          caption,
        ),
      );
    };

    const doPush = (x: number): boolean => {
      push('full', '入栈检查', `要入栈 ${x}：先判上溢，比较 top = ${top} 与 MAXSIZE-1 = ${CAP - 1}。`, {}, { 待入栈: x });
      if (top === CAP - 1) {
        push('full', '上溢', `top 已等于 ${CAP - 1}，栈满，元素 ${x} 无法入栈（上溢）。`, {}, { 待入栈: x, 判定: '上溢' });
        return false;
      }
      top += 1;
      data[top] = x;
      push('push', '入栈', `top 先加 1 变成 ${top}，再把 ${x} 写入 data[${top}]。`, { [top]: 'insert' }, { 待入栈: x, 判定: '成功' });
      return true;
    };

    const doPop = (): void => {
      push('empty', '出栈检查', `要出栈：先判下溢，比较 top = ${top} 与 -1。`, {}, { 判定: top === -1 ? '下溢' : '可出栈' });
      if (top === -1) {
        push('empty', '下溢', 'top 等于 -1，栈空，没有元素可取（下溢）。', {}, { 判定: '下溢' });
        return;
      }
      const v = data[top];
      push('pop', '出栈', `取出栈顶 data[${top}] = ${v}，随后 top 减 1。`, { [top]: 'delete' }, { 出栈值: String(v ?? '') });
      data[top] = null;
      top -= 1;
      push('pop', '出栈', `top 退到 ${top}，元素 ${v} 已出栈，栈长变为 ${top + 1}。`, {}, { 出栈值: String(v ?? '') });
    };

    push('init', '初始化', 'top 置为 -1，表示空栈：数组下标从 0 开始，-1 就是「栈外」。');
    vals.forEach((v) => doPush(v));

    push('full', '入栈检查', '为了观察上溢，用补充元素继续入栈，直到栈满。', {}, { 说明: '补充演示' });
    FILL.forEach((v) => {
      if (top < CAP - 1) doPush(v);
    });
    doPush(99);

    doPop();
    doPop();

    push('empty', '清空', '把剩下的元素全部出栈，观察 top 一路退回 -1。', {});
    while (top >= 0) doPop();
    doPop();

    push('done', '结束', '入栈出栈都只改 top，每次操作都是 O(1)，无需移动其他元素。');
    return steps;
  },
};
