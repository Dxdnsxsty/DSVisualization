import type { AlgorithmMeta, NodeState, ScenePointer, TraceStep } from '../../engine/types';
import { listScene, makeStep, node } from '../../engine/scene';

/** 链队列不带头结点，front 指向队头元素、rear 指向队尾元素。 */
export const linkedQueue: AlgorithmMeta = {
  slug: 'queue/linked-queue',
  title: '链队列 · 入队与出队',
  chapter: '第 3 章 栈和队列',
  category: 'ch3',
  summary: '入队接在队尾，出队摘掉队头，别忘 rear 复位。',
  complexity: { time: 'O(1)', space: 'O(n)', extra: '入队出队都只改指针，不移动元素' },
  difficulty: '进阶',
  inputHint: '输入 2–3 个整数依次入队，随后全部出队；注意最后一个元素出队后 rear 的复位。',
  defaultInput: [8, 3, 6],
  input: { min: -999, max: 999, minLen: 2, maxLen: 3 },
  code: {
    cpp: [
      { text: '#include <iostream>' },
      { text: 'struct QNode { int data; QNode *next; };' },
      { text: 'struct LinkQueue { QNode *front, *rear; };  // 不带头结点' },
      { text: 'void InitQueue(LinkQueue &Q) {' },
      { text: '  Q.front = Q.rear = NULL;', anchor: 'init' },
      { text: '}' },
      { text: 'void EnQueue(LinkQueue &Q, int x) {' },
      { text: '  QNode *s = new QNode;', anchor: 'enqueue' },
      { text: '  s->data = x;' },
      { text: '  s->next = NULL;' },
      { text: '  if (Q.rear == NULL) Q.front = s;', anchor: 'enqueue' },
      { text: '  else Q.rear->next = s;', anchor: 'enqueue' },
      { text: '  Q.rear = s;', anchor: 'enqueue' },
      { text: '}' },
      { text: 'bool DeQueue(LinkQueue &Q, int &x) {' },
      { text: '  if (Q.front == NULL) return false;', anchor: 'empty' },
      { text: '  QNode *q = Q.front;', anchor: 'dequeue' },
      { text: '  x = q->data;' },
      { text: '  Q.front = q->next;', anchor: 'dequeue' },
      { text: '  if (Q.front == NULL) Q.rear = NULL;', anchor: 'last' },
      { text: '  delete q;' },
      { text: '  return true;' },
      { text: '}' },
      { text: '// 出队顺序与入队顺序一致，先进先出', anchor: 'done' },
    ],
    python: [
      { text: 'class QNode:' },
      { text: '    def __init__(self, data):' },
      { text: '        self.data = data' },
      { text: '        self.next = None' },
      { text: 'class LinkQueue:  # 不带头结点' },
      { text: '    def __init__(self):' },
      { text: '        self.front = None' },
      { text: '        self.rear = None', anchor: 'init' },
      { text: '    def enqueue(self, x):' },
      { text: '        s = QNode(x)', anchor: 'enqueue' },
      { text: '        if self.rear is None:' },
      { text: '            self.front = s', anchor: 'enqueue' },
      { text: '        else:' },
      { text: '            self.rear.next = s', anchor: 'enqueue' },
      { text: '        self.rear = s', anchor: 'enqueue' },
      { text: '    def dequeue(self):' },
      { text: '        if self.front is None: return None', anchor: 'empty' },
      { text: '        q = self.front', anchor: 'dequeue' },
      { text: '        self.front = q.next', anchor: 'dequeue' },
      { text: '        if self.front is None:', anchor: 'last' },
      { text: '            self.rear = None', anchor: 'last' },
      { text: '        return q.data' },
      { text: '# 出队顺序与入队顺序一致，先进先出', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: '链队列用 front 与 rear 两个指针分别守住队头和队尾：入队把新结点接到 rear 之后并让 rear 后移，出队摘掉 front 所指的结点并让 front 后移。两端操作都是常数次指针赋值，因此入队出队都是 O(1)，也不会出现顺序队列的「假溢出」。',
      points: [
        '入队只改 rear，出队只改 front，互不干扰',
        '队列为空时 front 与 rear 都必须是 NULL，不能留悬空指针',
        '不带头结点省一个结点，但空队列要单独处理 front',
      ],
    },
    {
      heading: '最后一个元素出队的坑',
      body: '不带头结点的链队列里，最后一个元素出队后 front 变成 NULL，此时 rear 仍然指着刚被释放的结点。如果忘记执行 rear = NULL，rear 成为野指针，下一次入队就会往已释放的内存里挂结点。带结点的写法让 front 与 rear 始终指向头结点，天然没有这个问题。',
      points: ['出队后必须判断 front 是否为空，为空就同步把 rear 置空', '判空条件是 front == NULL，不是 front == rear', '若用头结点，判空变成 front == rear，代码更短但要占一个结点'],
    },
    {
      heading: '与循环队列的对比',
      body: '顺序循环队列靠取模复用数组空间，容量固定、需要牺牲一个单元判满；链队列没有容量上限也不判满，代价是每个元素多一个指针并需要动态申请。数据量波动大时链队列更省心，数据量稳定且追求缓存友好时循环队列更合适。',
    },
  ],
  quiz: [
    {
      q: '不带头结点的链队列，队列为空的条件是？',
      options: ['front == rear', 'front == NULL', 'rear->next == NULL', 'front->next == rear'],
      answer: 1,
      explain: '空队列没有任何结点，front 与 rear 都是 NULL，用 front == NULL 判定即可。',
    },
    {
      q: '最后一个元素出队后若忘记把 rear 置空，会发生什么？',
      options: ['没有影响', 'rear 悬空，下次入队写到已释放的内存', 'front 也变成野指针', '队列自动变满'],
      answer: 1,
      explain: 'rear 仍指向被 delete 的结点，再次入队会通过 rear->next 访问已释放内存。',
    },
    {
      q: '链队列入队时若队列原本为空，需要额外做什么？',
      options: ['让 front 也指向新结点', '把 rear 置空', '释放旧结点', '不需要额外操作'],
      answer: 0,
      explain: '空队列时 front 与 rear 都为 NULL，新结点既是队头又是队尾，必须同时让 front 指向它。',
    },
  ],
  generate: (input) => {
    const steps: TraceStep[] = [];
    const ok = input.length >= 2 && input.slice(0, 3).every((v) => Number.isFinite(v));
    const vals = (ok ? input : [8, 3, 6]).slice(0, 3);

    const values: Record<string, number> = {};
    const queue: string[] = [];
    const out: number[] = [];
    let seq = 0;
    let k = 0;

    const push = (
      anchor: string,
      phase: string,
      caption: string,
      states: Record<string, NodeState>,
      vars: Record<string, string | number>,
    ) => {
      const pointers: ScenePointer[] = queue.length === 0
        ? [{ label: 'front=rear=NULL', index: null }]
        : [{ label: 'front', index: 0 }, { label: 'rear', index: queue.length - 1 }];
      steps.push(makeStep(
        k++, anchor, phase,
        listScene(
          queue.map((id) => node(id, values[id], states[id] ?? 'default')),
          pointers,
          `队长 ${queue.length} · front 守队头，rear 守队尾`,
        ),
        vars, caption,
      ));
    };

    const stat = (op: string, v: string | number): Record<string, string | number> => ({
      队头: queue.length === 0 ? 'NULL' : values[queue[0]],
      队尾: queue.length === 0 ? 'NULL' : values[queue[queue.length - 1]],
      队长: queue.length,
      操作: op,
      数值: v,
    });

    const doEnqueue = (x: number) => {
      const id = `q${seq++}`;
      values[id] = x;
      const empty = queue.length === 0;
      queue.push(id);
      push(
        'enqueue',
        '入队',
        empty
          ? `队列原本为空：新结点 ${x} 既是队头也是队尾，所以 front 与 rear 一起指向它。`
          : `rear->next = s，rear = s：${x} 接到队尾，front 保持不动。`,
        { [id]: 'insert' },
        stat('入队', x),
      );
    };

    const doDequeue = () => {
      if (queue.length === 0) {
        push('empty', '下溢', 'front == NULL，队列已空，无法出队。', {}, stat('出队', '—'));
        return;
      }
      const id = queue[0];
      const v = values[id];
      out.push(v);
      push('dequeue', '取队头', `队头 data = ${v}，先读出它的值，再让 front 后移。`, { [id]: 'delete' }, stat('出队', v));
      queue.shift();
      if (queue.length === 0) {
        push(
          'last',
          'rear 复位',
          `最后一个元素 ${v} 出队后 front == NULL，必须执行 rear = NULL（即让 rear 指回 front）。漏掉这一步，rear 就悬空了。`,
          {},
          stat('出队', v),
        );
      } else {
        push('dequeue', 'front 后移', `front = front->next，队头变成 ${values[queue[0]]}，队长 ${queue.length}。`, { [queue[0]]: 'active' }, stat('出队', v));
      }
    };

    push('init', '初始化', 'front = rear = NULL，空队列；不带头结点，所以两个指针都要亲手维护。', {}, { 队头: 'NULL', 队尾: 'NULL', 队长: 0, 操作: '初始化', 数值: '—' });

    vals.forEach((v) => doEnqueue(v));
    vals.forEach(() => doDequeue());

    doDequeue();
    doEnqueue(vals[0]);
    push('done', '结束', `出队顺序 ${out.join(' → ')}，与入队顺序一致，正是先进先出。`, {}, stat('结束', '—'));
    return steps;
  },
};
