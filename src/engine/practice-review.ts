import { getAlgorithm } from '../algorithms/registry';
import { customPracticeQuestions, practiceQuestions, type PracticeQuestion } from './practice';
import { readStudyData, updateStudyData } from './study-storage';

export interface SavedMistake {
  id: string;
  slug: string;
  choice: string;
  input?: number[];
}

export interface PracticeMistake extends SavedMistake {
  question: PracticeQuestion;
}

export function practiceQuestionId(slug: string, question: PracticeQuestion): string {
  const { input, step, before, after, custom } = question;
  return JSON.stringify([custom ? 'custom' : 'preset', slug, input, step, before.anchor, after.anchor]);
}

function migrateId(id: string, slug: string, custom: boolean): string {
  try {
    const parts: unknown = JSON.parse(id);
    if (Array.isArray(parts) && parts.length === 7 && parts[0] === slug) {
      return JSON.stringify([custom ? 'custom' : 'preset', ...parts.slice(0, 5)]);
    }
  } catch { /* Unknown record format. */ }
  return id;
}

export function restorePracticeMistakes(raw: unknown): PracticeMistake[] {
  try {
    if (!Array.isArray(raw)) return [];
    const questions = new Map<string, Map<string, PracticeQuestion>>();
    const mistakes = new Map<string, PracticeMistake>();

    for (const entry of raw) {
      if (!entry || typeof entry.id !== 'string' || typeof entry.slug !== 'string' ||
        typeof entry.choice !== 'string' || entry.choice.length > 512) continue;
      const { id, slug, choice, input } = entry as SavedMistake;
      const algo = getAlgorithm(slug);
      if (!algo || (input !== undefined && (!Array.isArray(input) || input.length > 99 || !input.every(Number.isSafeInteger)))) continue;
      const key = JSON.stringify([slug, input]);
      if (!questions.has(key)) {
        const pool = input === undefined ? practiceQuestions(algo) : customPracticeQuestions(algo, input);
        questions.set(key, new Map(pool.map((question) => [practiceQuestionId(slug, question), question])));
      }
      const stableId = migrateId(id, slug, input !== undefined);
      const question = questions.get(key)?.get(stableId);
      if (question && choice !== question.answer) {
        mistakes.set(stableId, { id: stableId, slug, choice, question });
      }
    }
    return [...mistakes.values()];
  } catch {
    return [];
  }
}

export function readPracticeMistakes(): PracticeMistake[] {
  return restorePracticeMistakes(readStudyData().mistakes);
}

export function serializeMistakes(mistakes: PracticeMistake[]): SavedMistake[] {
  return mistakes.map(({ id, slug, choice, question }) => ({
    id, slug, choice, input: question.custom ? question.input : undefined,
  }));
}

export function savePracticeMistakes(mistakes: PracticeMistake[]): boolean {
  return updateStudyData((data) => ({ ...data, mistakes: serializeMistakes(mistakes) }));
}
