import type { AlgorithmMeta, TraceStep } from './types';
import { DEFAULT_INPUT, parseMatchInput, validateInput } from './input';

export interface PracticeQuestion {
  input: number[];
  step: number;
  before: TraceStep;
  after: TraceStep;
  prompt: string;
  answer: string;
  choices: string[];
  custom?: true;
}

export function supportsCustomPractice(slug: string): boolean {
  return slug === 'graph/dijkstra' || slug === 'tree/inorder';
}

function customPrompt(slug: string, before: TraceStep, after: TraceStep) {
  if (slug === 'tree/inorder' && after.anchor === 'visit') {
    const value = after.scene.output?.values.at(-1);
    if (value !== undefined) return {
      prompt: '中序遍历下一个访问的结点值是什么？', answer: value,
      alternatives: before.scene.nodes.map((node) => node.value),
    };
  }
  const rows = before.scene.shortestPath?.rows;
  const nextRows = after.scene.shortestPath?.rows;
  if (slug !== 'graph/dijkstra' || !rows || !nextRows) return;
  if (after.anchor === 'pick') {
    const chosen = nextRows.find((row, index) => row.settled && !rows[index].settled);
    if (chosen) return {
      prompt: '按距离从小到大，下一个确定的是哪个顶点？距离相同则按顶点输入顺序选取。',
      answer: chosen.vertex, alternatives: rows.filter((row) => !row.settled).map((row) => row.vertex),
    };
  }
  if (after.anchor === 'update') {
    const index = nextRows.findIndex((row) => row.changed);
    const changed = nextRows[index];
    const source = rows.find((row) => row.vertex === after.vars.本轮顶点);
    if (changed?.distance == null || source?.distance == null) return;
    return {
      prompt: `检查边 ${source.vertex} → ${changed.vertex}（权重 ${after.vars.边权}）后，${changed.vertex} 的距离是多少？`,
      answer: String(changed.distance),
      alternatives: [String(rows[index].distance ?? '∞'), String(source.distance), String(after.vars.边权)],
    };
  }
}

export function hasCustomPracticeQuestion(slug: string, trace: TraceStep[]): boolean {
  return supportsCustomPractice(slug) && trace.some((before, step) => {
    const after = trace[step + 1];
    const item = after && customPrompt(slug, before, after);
    return item?.alternatives.some((choice) => choice !== item.answer) ?? false;
  });
}

export function customPracticeQuestions(algo: AlgorithmMeta, input: number[]): PracticeQuestion[] {
  if (!supportsCustomPractice(algo.slug) || validateInput(algo.input ?? DEFAULT_INPUT, input)) return [];
  const trace = algo.generate(input);
  const questions: PracticeQuestion[] = [];
  for (let step = 0; step + 1 < trace.length; step++) {
    const before = trace[step];
    const after = trace[step + 1];
    const item = customPrompt(algo.slug, before, after);
    if (!item) continue;
    const choices = [...new Set(item.alternatives)].filter((choice) => choice !== item.answer).slice(0, 2);
    if (!choices.length) continue;
    choices.splice(step % (choices.length + 1), 0, item.answer);
    questions.push({ input, step, before, after, prompt: item.prompt, answer: item.answer, choices, custom: true });
  }
  return questions;
}

const examples: Record<string, number[][]> = {
  'stack/seq-stack': [[-123, 0, 999], [3, 8, 5]],
  'queue/circular-queue': [[4, 7, 9, 2, 6], [-123, 0, 999]],
  'list/reverse': [[10, 20, 30, 40], [7, -5, 0]],
  'string/kmp': [parseMatchInput('aaaabaaaaa', 'aaaaa').nums, parseMatchInput('abcxabcde', 'abcde').nums],
  'search/hash-linear': [[10, 21, 32, 32], [-1, 10, 0, 21, -12]],
  'search/hash-chain': [[15, 22, 8, 8], [1, 8, 15, 22], [-1, 6, 13, -8, -8]],
};

function probePosition(step: TraceStep): number | null | undefined {
  return step.scene.pointers?.find(({ label }) => label === 'p')?.index;
}

function promptFor(slug: string, input: number[], before: TraceStep, after: TraceStep) {
  switch (slug) {
    case 'stack/seq-stack': {
      const top = before.scene.pointers?.find((pointer) => pointer.label === 'top')?.index;
      if (before.phase !== '出栈检查' || after.phase !== '出栈' || top == null || top >= input.length) return;
      const answer = String(after.vars.出栈值);
      return { prompt: '接下来从栈顶取出的值是多少？', answer, alternatives: input.map(String) };
    }
    case 'queue/circular-queue': {
      if (before.anchor !== 'enqueue' || after.anchor !== 'wrap') return;
      const rear = Number(after.vars.rear);
      const capacity = after.scene.capacity ?? after.scene.nodes.length;
      return {
        prompt: '入队写入完成。执行 (rear + 1) % MAXSIZE 后，rear 会指向哪个下标？',
        answer: String(rear),
        alternatives: [String(before.vars.rear), String((rear + 1) % capacity)],
      };
    }
    case 'list/reverse': {
      if (before.anchor !== 'save' || after.anchor !== 'link') return;
      const position = before.scene.pointers?.find((pointer) => pointer.label === 'p')?.index;
      const from = position == null ? undefined : before.scene.nodes[position]?.id;
      const link = after.scene.listLinks?.find((item) => item.from === from && item.field === 'next');
      if (!link) return;
      const answer = link.to === null ? 'NULL' : after.scene.nodes.find((node) => node.id === link.to)?.value;
      if (answer === undefined) return;
      return {
        prompt: '执行 p->next = pre 后，p 的 next 会指向哪里？',
        answer,
        alternatives: [String(before.vars.q), 'NULL', ...input.map(String)],
      };
    }
    case 'string/kmp': {
      if (before.anchor !== 'kmpCmp' || after.anchor !== 'kmpBack') return;
      const j = Number(before.vars.j);
      return {
        prompt: '当前位置失配。主串下标 i 保持不动，模式串下标 j 应退到哪里？',
        answer: String(after.vars.j),
        alternatives: [String(j), '0', '-1', String(j - 1), String(Math.min(j + 1, input[0] - 1))],
      };
    }
    case 'search/hash-linear': {
      if (!(before.anchor === 'cmp' && after.anchor === 'probe') &&
          !(before.anchor === 'scmp' && after.anchor === 'sprobe')) return;
      const from = probePosition(before);
      const to = probePosition(after);
      if (from == null || to == null) return;
      const size = before.scene.nodes.length;
      return {
        prompt: `槽位 ${from} 无法结束本次探测。下一次应该检查哪个槽位？`,
        answer: String(to),
        alternatives: [String(from), String((from + size - 1) % size)],
      };
    }
    case 'search/hash-chain': {
      const nodes = after.scene.aux?.nodes ?? [];
      if (before.anchor === 'cmp' && after.anchor === 'append') {
        const inserted = nodes.findIndex(({ state }) => state === 'insert');
        if (inserted < 0) return;
        return {
          prompt: `已经到达桶 ${before.vars.散列地址} 的链尾。尾插后，新结点是桶里的第几个结点？`,
          answer: String(inserted + 1),
          alternatives: [String(inserted), String(inserted + 2)],
        };
      }
      if (before.anchor !== 'scmp' || !['scmp', 'found', 'fail'].includes(after.anchor)) return;
      const end = '到达链尾，查找失败';
      const answer = after.anchor === 'fail' ? end : nodes.find(({ state }) => state === 'compare' || state === 'found')?.value;
      if (answer === undefined) return;
      const current = before.scene.aux?.nodes.find(({ state }) => state === 'compare')?.value;
      return {
        prompt: '当前桶内结点和目标不相等。下一步会比较哪个值，还是已经到了链尾？',
        answer,
        alternatives: [...(current === undefined ? [] : [current]), end, ...nodes.filter(({ id }) => id !== 'nil').map(({ value }) => value)],
      };
    }
    default:
      return { prompt: '下一步会进入哪个阶段？', answer: after.phase, alternatives: [before.phase, '算法结束'] };
  }
}

export function practiceQuestions(algo: AlgorithmMeta): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  const customExamples = examples[algo.slug];
  for (const input of customExamples ?? [algo.defaultInput]) {
    const trace = algo.generate(input);
    const phases = customExamples ? [] : [...new Set(trace.map((frame) => frame.phase))];
    const sample: PracticeQuestion[] = [];
    for (let step = 0; step + 1 < trace.length; step++) {
      const before = trace[step];
      const after = trace[step + 1];
      const item = promptFor(algo.slug, input, before, after);
      if (!item) continue;
      const alternatives = [...item.alternatives, ...phases];
      const wrong = [...new Set(alternatives)].filter((choice) => choice !== item.answer).slice(0, 2);
      if (wrong.length === 0) continue;
      const choices = [...wrong];
      choices.splice((step + questions.length) % (wrong.length + 1), 0, item.answer);
      sample.push({ input, step, before, after, prompt: item.prompt, answer: item.answer, choices });
    }
    // 队列和线性探测优先展示从表尾回到表头的题目。
    const wrapAt = sample.findIndex(({ before, after }) => after.phase === '取模回绕' ||
      (algo.slug === 'search/hash-linear' && probePosition(before) === before.scene.nodes.length - 1 && probePosition(after) === 0));
    if (wrapAt > 0) sample.unshift(...sample.splice(wrapAt, 1));
    questions.push(...sample);
  }
  return questions;
}
