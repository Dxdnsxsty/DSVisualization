export const STUDY_KEY = 'dsv-study';
const CHANGE = 'dsv-study-change';

export interface StudyData {
  version: 1;
  watched: string[];
  passed: string[];
  lastLesson: unknown;
  mistakes: unknown[];
}

const empty = (): StudyData => ({ version: 1, watched: [], passed: [], lastLesson: null, mistakes: [] });
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

function readJSON(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}

export function readStudyData(): StudyData {
  const saved = readJSON(STUDY_KEY) as Partial<StudyData> | null;
  if (saved?.version === 1) return {
    version: 1, watched: strings(saved.watched), passed: strings(saved.passed),
    lastLesson: saved.lastLesson ?? null, mistakes: Array.isArray(saved.mistakes) ? saved.mistakes : [],
  };

  const legacy = empty();
  legacy.watched = strings(readJSON('dsv-learned'));
  legacy.lastLesson = readJSON('dsv-last-lesson');
  const mistakes = readJSON('dsv-practice-mistakes');
  legacy.mistakes = Array.isArray(mistakes) ? mistakes : [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dsv-practice-') && localStorage.getItem(key) === 'done') {
        legacy.passed.push(key.slice('dsv-practice-'.length));
      }
    }
  } catch { /* Storage may be unavailable. */ }
  return legacy;
}

export function updateStudyData(update: (data: StudyData) => StudyData): boolean {
  try {
    const before = readStudyData();
    const after = update(before);
    if (after === before) return true;
    localStorage.setItem(STUDY_KEY, JSON.stringify(after));
    window.dispatchEvent(new Event(CHANGE));
    return true;
  } catch { return false; }
}

export function markStudyMilestone(slug: string, milestone: 'watched' | 'passed'): void {
  updateStudyData((data) => data[milestone].includes(slug)
    ? data : { ...data, [milestone]: [...data[milestone], slug] });
}

export function studyMilestonesSnapshot(): string {
  const { watched, passed } = readStudyData();
  return JSON.stringify([watched, passed]);
}

export function subscribeStudy(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STUDY_KEY || event.key === null) listener();
  };
  window.addEventListener(CHANGE, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE, listener);
    window.removeEventListener('storage', onStorage);
  };
}
