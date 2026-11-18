import type { AlgorithmMeta, NodeState, TraceStep } from '../../engine/types';
import { arrayScene, makeStep, node } from '../../engine/scene';

const CAP = 6;
/** 循环队列牺牲一个单元来区分队空与队满，因此最多存 CAP-1 个元素。 */
const MAXE = CAP - 1;

export const circularQueue: AlgorithmMeta = {
  slug: 'queue/circular-queue',
  title: '循环队列 · 入队与出队',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: '取模回绕：front==rear 判队空。',
  complexity: { time: 'O(1)', space: 'O(1)', extra: '牺牲一个单元区分队空与队满' },
  difficulty: '入门',
  inputHint: '输入 5 个整数依次入队，演示队满、rear 从 5 回绕到 0、出队直到队空。',
  defaultInput: [4, 7, 9, 2, 6],
  input: { min: -999, max: 999, minLen: 3, maxLen: 5 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: '#define MAXSIZE 6' },
      { text: 'typedef struct { int data[MAXSIZE]; int front, rear; } SqQueue;' },
      { text: 'void InitQueue(SqQueue &Q) {' },
      { text: '  Q.front = Q.rear = 0;', anchor: 'init' },
      { text: '}' },
      { text: 'bool EnQueue(SqQueue &Q, int x) {' },
      { text: '  if ((Q.rear + 1) % MAXSIZE == Q.front)', anchor: 'full' },
      { text: '    return false;' },
      { text: '  Q.data[Q.rear] = x;', anchor: 'enqueue' },
      { text: '  Q.rear = (Q.rear + 1) % MAXSIZE;', anchor: 'wrap' },
      { text: '  return true;' },
      { text: '}' },
      { text: 'bool DeQueue(SqQueue &Q, int &x) {' },
      { text: '  if (Q.front == Q.rear)', anchor: 'empty' },
      { text: '    return false;' },
      { text: '  x = Q.data[Q.front];', anchor: 'dequeue' },
      { text: '  Q.front = (Q.front + 1) % MAXSIZE;' },
      { text: '  return true;' },
      { text: '}' },
      { text: 'int main() {' },
      { text: '  // 入队、出队，观察 rear 的回绕', anchor: 'done' },
      { text: '  return 0;' },
      { text: '}' },
    ],
    python: [
      { text: 'MAXSIZE = 6' },
      { text: 'class SqQueue:' },
      { text: '    def __init__(self):' },
      { text: '        self.data = [0] * MAXSIZE' },
      { text: '        self.front = 0' },
      { text: '        self.rear = 0', anchor: 'init' },
      { text: '    def enqueue(self, x):' },
      { text: '        if (self.rear + 1) % MAXSIZE == self.front:', anchor: 'full' },
      { text: '            return False' },
      { text: '        self.data[self.rear] = x', anchor: 'enqueue' },
      { text: '        self.rear = (self.rear + 1) % MAXSIZE', anchor: 'wrap' },
      { text: '        return True' },
      { text: '    def dequeue(self):' },
      { text: '        if self.front == self.rear:', anchor: 'empty' },
      { text: '            return False' },
      { text: '        x = self.data[self.front]', anchor: 'dequeue' },
      { text: '        self.front = (self.front + 1) % MAXSIZE' },
      { text: '        return x' },
      { text: 'q = SqQueue()' },
      { text: '# 入队、出队，观察 rear 的回绕', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '为什么需要循环队列',
      body: '顺序队列用 front、rear 两个下标标记队头与队尾，元素只能从队尾进、队头出。如果 front 只增不减，出队后前面的空位就永远浪费，最后会出现「队尾越界但队列其实不满」的假溢出。把数组首尾相接（下标对 MAXSIZE 取模）就得到循环队列。',
      points: [
        '入队：Q[rear] = x，rear = (rear+1) % MAXSIZE',
        '出队：取 Q[front]，front = (front+1) % MAXSIZE',
        'rear 从 MAXSIZE-1 加 1 后取模回到 0，这就是回绕',
      ],
    },
    {
      heading: '队空与队满的区分',
      body: '只凭 front == rear 无法判断空还是满：空的时候相等，绕满一圈时也相等。教材的做法是「牺牲一个单元」：约定 rear 的下一个位置若等于 front 就视为满。这样队空是 front == rear，队满则是 (rear+1) % MAXSIZE == front，队列最多存 MAXSIZE-1 个元素。',
      points: [
        '元素个数 = (rear - front + MAXSIZE) % MAXSIZE',
        '判定顺序必须是先判满再入队、先判空再出队',
        '另一种做法是额外用 length 变量计数，可以不牺牲单元',
      ],
    },
  ],
  quiz: [
    { q: '循环队列判断队满的条件是？', options: ['rear == MAXSIZE-1', '(rear+1) % MAXSIZE == front', 'front == rear', 'rear - front == MAXSIZE'], answer: 1, explain: '牺牲一个单元后，rear 再走一格就撞上 front 表示满。' },
    { q: '容量 MAXSIZE = 6 的循环队列最多能存多少个元素？', options: ['6', '5', '7', '4'], answer: 1, explain: '牺牲一个单元区分空满，实际最多存 MAXSIZE-1 = 5 个。' },
    { q: 'rear = 5、MAXSIZE = 6 时入队一个元素后，rear 的值是？', options: ['6', '0', '5', '1'], answer: 1, explain: '(5+1) % 6 = 0，rear 回绕到数组头部。' },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const base = [4, 7, 9, 2, 6];
    const ok = input.length >= 3 && input.slice(0, 5).every((v) => Number.isFinite(v));
    const raw = ok ? input.slice(0, 5) : base;
    const vals = Array.from({ length: MAXE }, (_, i) =>
      raw[i] === undefined ? base[i] : Math.abs(Math.trunc(raw[i])) % 100,
    );
    const data: (number | null)[] = Array.from({ length: CAP }, () => null);
    let front = 0;
    let rear = 0;
    let k = 0;
    const count = (): number => (rear - front + CAP) % CAP;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<number, NodeState> = {},
      extra: Record<string, string | number> = {},
    ) => {
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          {
            ...arrayScene(
              Array.from({ length: CAP }, (_, i) => node(`q${i}`, data[i] ?? '', states[i] ?? 'default')),
              [
                { label: 'front', index: front },
                { label: 'rear', index: rear },
              ],
              CAP,
              `容量 ${CAP}，牺牲一格，最多存 ${MAXE} 个 · 当前 ${count()} 个`,
            ),
            layout: 'ring-queue',
          },
          { front, rear, 元素个数: count(), 最多可存: MAXE, ...extra },
          caption,
        ),
      );
    };

    const enqueue = (x: number): boolean => {
      if ((rear + 1) % CAP === front) {
        push(
          'full',
          '队满判定',
          `要入队 ${x}：(rear+1) % ${CAP} = ${(rear + 1) % CAP}，恰好等于 front = ${front}，队满，拒绝入队。`,
          {},
          { 待入队: x },
        );
        return false;
      }
      data[rear] = x;
      push('enqueue', '入队', `判满通过，把 ${x} 写入 Q[${rear}]，该位置原先是空的。`, { [rear]: 'insert' }, { 待入队: x });
      const old = rear;
      rear = (rear + 1) % CAP;
      if (rear === 0) {
        push(
          'wrap',
          '取模回绕',
          `rear 由 ${old} 加 1 后对 ${CAP} 取模得 0，回绕到数组头部——这就是「循环」队列。`,
          { [old]: 'insert' },
          { 待入队: x },
        );
      } else {
        push('wrap', '指针后移', `rear 后移一格变成 ${rear}，仍指向下一个空位。`, {}, { 待入队: x });
      }
      return true;
    };

    const dequeue = (): void => {
      if (front === rear) {
        push('empty', '队空判定', `front == rear == ${front}，队列为空，没有元素可以出队（下溢）。`, {}, { 判定: '队空' });
        return;
      }
      const v = data[front];
      push('dequeue', '出队', `取走队头 Q[${front}] = ${v}，随后 front 后移一格。`, { [front]: 'delete' }, { 出队值: String(v ?? '') });
      data[front] = null;
      front = (front + 1) % CAP;
      const movement = front === 0 ? `front 从 ${CAP - 1} 取模回到 0` : `front 后移到 ${front}`;
      push('dequeue', '指针后移', `${movement}，队列还剩 ${count()} 个元素。`, {}, { 出队值: String(v ?? '') });
    };

    push('init', '初始化', 'front = rear = 0，队列为空：空队列的标志就是两个指针重合。');
    vals.forEach((v) => enqueue(v));
    enqueue(88);
    dequeue();
    enqueue(66);
    dequeue();
    dequeue();
    while (front !== rear) dequeue();
    dequeue();
    push('done', '结束', 'front == rear 判空、(rear+1) % maxsize == front 判满，取模让线性数组首尾相接。');
    return steps;
  },
};
