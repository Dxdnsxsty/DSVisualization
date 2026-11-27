import { getAlgorithm } from '../algorithms/registry';
import { customPracticeQuestions, practiceQuestions, type PracticeQuestion } from './practice';
import { readStudyData, STUDY_KEY } from './study-storage';

const MISTAKE_PREFIX = 'dsv-mistake:';

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

export function readPracticeMistakes(base = readStudyData().mistakes): PracticeMistake[] {
  const mistakes = new Map(restorePracticeMistakes(base).map((record) => [record.id, record]));
  const changes: { record: unknown; order: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(MISTAKE_PREFIX)) continue;
      const id = key.slice(MISTAKE_PREFIX.length);
      const value = localStorage.getItem(key);
      if (value === 'null') mistakes.delete(id);
      else if (value) {
        try {
          const change = JSON.parse(value);
          if (change?.id === id) changes.push({ record: change, order: Number(change.recordedAt) || 0 });
        } catch { /* Ignore a damaged entry. */ }
      }
    }
  } catch { /* Storage may be unavailable. */ }
  const ordered = changes.sort((a, b) => a.order - b.order).map(({ record }) => record);
  for (const change of restorePracticeMistakes(ordered)) mistakes.set(change.id, change);
  return [...mistakes.values()];
}

export function serializeMistakes(mistakes: PracticeMistake[]): SavedMistake[] {
  return mistakes.map(({ id, slug, choice, question }) => ({
    id, slug, choice, input: question.custom ? question.input : undefined,
  }));
}

export function updatePracticeMistake(id: string, mistake: PracticeMistake | null): boolean {
  try {
    // Each question has its own key so updates in separate tabs cannot overwrite the list.
    // A null value suppresses older copies in the study record or an imported backup.
    const key = MISTAKE_PREFIX + id;
    let recordedAt = Date.now();
    try { recordedAt = JSON.parse(localStorage.getItem(key) ?? 'null')?.recordedAt ?? recordedAt; }
    catch { /* Replace a damaged entry. */ }
    const value = mistake ? { ...serializeMistakes([mistake])[0], recordedAt } : null;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function subscribePracticeMistakes(listener: () => void): () => void {
  const onStorage = ({ key, oldValue, newValue }: StorageEvent) => {
    if (key === null || key?.startsWith(MISTAKE_PREFIX) || key === 'dsv-practice-mistakes') listener();
    else if (key === STUDY_KEY) {
      const mistakeData = (value: string | null) => {
        try { return JSON.stringify(JSON.parse(value ?? 'null')?.mistakes); } catch { return undefined; }
      };
      if (mistakeData(oldValue) !== mistakeData(newValue)) listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
