import type { AlgorithmMeta, TraceStep } from './types';

export interface PracticeQuestion {
  input: number[];
  step: number;
  before: TraceStep;
  after: TraceStep;
  prompt: string;
  answer: string;
  choices: string[];
}

const examples: Record<string, number[][]> = {
  'stack/seq-stack': [[-123, 0, 999], [3, 8, 5]],
  'queue/circular-queue': [[4, 7, 9, 2, 6], [-123, 0, 999]],
  'list/reverse': [[10, 20, 30, 40], [7, -5, 0]],
};

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
    // 把最能体现环形下标的 5 → 0 帧放在每组队列题的开头。
    const wrapAt = sample.findIndex(({ after }) => after.phase === '取模回绕');
    if (wrapAt > 0) sample.unshift(...sample.splice(wrapAt, 1));
    questions.push(...sample);
  }
  return questions;
}
