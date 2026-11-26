import { getAlgorithm } from '../algorithms/registry';
import { customPracticeQuestions, practiceQuestions, type PracticeQuestion } from './practice';

const KEY = 'dsv-practice-mistakes';

interface SavedMistake {
  id: string;
  slug: string;
  choice: string;
  input?: number[];
}

export interface PracticeMistake extends SavedMistake {
  question: PracticeQuestion;
}

export function practiceQuestionId(slug: string, question: PracticeQuestion): string {
  const { input, step, before, after, prompt, answer } = question;
  return JSON.stringify([slug, input, step, before.anchor, after.anchor, prompt, answer]);
}

export function readPracticeMistakes(): PracticeMistake[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    const questions = new Map<string, Map<string, PracticeQuestion>>();
    const mistakes = new Map<string, PracticeMistake>();

    for (const entry of raw) {
      if (!entry || typeof entry.id !== 'string' || typeof entry.slug !== 'string' || typeof entry.choice !== 'string') continue;
      const { id, slug, choice, input } = entry as SavedMistake;
      const algo = getAlgorithm(slug);
      if (!algo || (input !== undefined && (!Array.isArray(input) || input.length > 99 || !input.every(Number.isSafeInteger)))) continue;
      const key = JSON.stringify([slug, input]);
      if (!questions.has(key)) {
        const pool = input === undefined ? practiceQuestions(algo) : customPracticeQuestions(algo, input);
        questions.set(key, new Map(pool.map((question) => [practiceQuestionId(slug, question), question])));
      }
      const question = questions.get(key)?.get(id);
      if (question && choice !== question.answer && question.choices.includes(choice)) {
        mistakes.set(id, { id, slug, choice, question });
      }
    }
    return [...mistakes.values()];
  } catch {
    return [];
  }
}

export function savePracticeMistakes(mistakes: PracticeMistake[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(mistakes.map(({ id, slug, choice, question }) => ({
      id, slug, choice, input: question.custom ? question.input : undefined,
    }))));
    return true;
  } catch {
    return false;
  }
}
