import { getAlgorithm } from '../algorithms/registry';
import { customPracticeQuestions, practiceQuestions, type PracticeQuestion } from './practice';
import { readStudyData, STUDY_KEY } from './study-storage';

const MISTAKE_PREFIX = 'dsv-mistake:';

export interface MistakeState {
  id: string;
  slug: string;
  choice: string | null;
  input?: number[];
  updatedAt: number;
}

interface RestoredMistakeState extends MistakeState {
  question: PracticeQuestion;
}

export interface PracticeMistake extends RestoredMistakeState {
  choice: string;
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

function identityFromId(id: string): Pick<MistakeState, 'id' | 'slug' | 'input'> | undefined {
  try {
    const parts: unknown = JSON.parse(id);
    if (!Array.isArray(parts) || parts.length !== 6) return;
    const [kind, slug, input] = parts;
    if ((kind !== 'custom' && kind !== 'preset') || typeof slug !== 'string') return;
    return { id, slug, input: kind === 'custom' ? input : undefined };
  } catch { return undefined; }
}

function timestamp(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function restoreMistakeStates(raw: unknown): RestoredMistakeState[] {
  try {
    if (!Array.isArray(raw)) return [];
    const questions = new Map<string, Map<string, PracticeQuestion>>();
    const mistakes = new Map<string, RestoredMistakeState>();

    for (const entry of raw) {
      if (!entry || typeof entry.id !== 'string' || typeof entry.slug !== 'string' ||
        (entry.choice !== null && (typeof entry.choice !== 'string' || entry.choice.length > 512))) continue;
      const { id, slug, choice, input } = entry as MistakeState;
      const algo = getAlgorithm(slug);
      if (!algo || (input !== undefined && (!Array.isArray(input) || input.length > 99 || !input.every(Number.isSafeInteger)))) continue;
      const key = JSON.stringify([slug, input]);
      if (!questions.has(key)) {
        const pool = input === undefined ? practiceQuestions(algo) : customPracticeQuestions(algo, input);
        questions.set(key, new Map(pool.map((question) => [practiceQuestionId(slug, question), question])));
      }
      const stableId = migrateId(id, slug, input !== undefined);
      const question = questions.get(key)?.get(stableId);
      if (question && choice !== question.answer) mergeMistakeState(mistakes, {
        id: stableId, slug, input, choice, question, updatedAt: timestamp(entry.updatedAt),
      });
    }
    return [...mistakes.values()];
  } catch {
    return [];
  }
}

export function mergeMistakeState<T extends MistakeState>(records: Map<string, T>, incoming: T): void {
  const prior = records.get(incoming.id);
  if (!prior || incoming.updatedAt > prior.updatedAt ||
    (incoming.updatedAt === prior.updatedAt && (
      incoming.choice === null || (prior.choice !== null && incoming.choice > prior.choice)
    ))) records.set(incoming.id, incoming);
}

export function readMistakeStates(base = readStudyData().mistakes): RestoredMistakeState[] {
  const changes: { record: unknown; order: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(MISTAKE_PREFIX)) continue;
      const id = key.slice(MISTAKE_PREFIX.length);
      const value = localStorage.getItem(key);
      if (value === 'null') {
        const identity = identityFromId(id);
        if (identity) changes.push({ record: { ...identity, choice: null, updatedAt: 0 }, order: 0 });
      }
      else if (value) {
        try {
          const change = JSON.parse(value);
          if (change?.id === id) changes.push({ record: change, order: Number(change.recordedAt) || 0 });
        } catch { /* Ignore a damaged entry. */ }
      }
    }
  } catch { /* Storage may be unavailable. */ }
  const ordered = changes.sort((a, b) => a.order - b.order).map(({ record }) => record);
  return restoreMistakeStates([...base, ...ordered]);
}

export function readPracticeMistakes(): PracticeMistake[] {
  return readMistakeStates().filter((record): record is PracticeMistake => record.choice !== null);
}

export function serializeMistakeState({ id, slug, input, choice, updatedAt }: MistakeState): MistakeState {
  return { id, slug, input, choice, updatedAt };
}

export function updatePracticeMistake(id: string, mistake: PracticeMistake | null): boolean {
  try {
    // Store each question separately so distinct updates in different tabs cannot overwrite one another.
    const identity = identityFromId(id);
    if (!identity) return false;
    const key = MISTAKE_PREFIX + id;
    const prior = readMistakeStates().find((record) => record.id === id);
    const now = Date.now();
    let recordedAt = now;
    try { recordedAt = timestamp(JSON.parse(localStorage.getItem(key) ?? 'null')?.recordedAt) || now; }
    catch { /* Replace a damaged entry. */ }
    const updatedAt = Math.min(Number.MAX_SAFE_INTEGER, Math.max(now, (prior?.updatedAt ?? 0) + 1));
    const value = { ...identity, choice: mistake?.choice ?? null, recordedAt, updatedAt };
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
