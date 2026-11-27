import { getAlgorithm } from '../algorithms/registry';
import { validateLessonProgress } from './learning-progress';
import { mergeMistakeState, readMistakeStates, restoreMistakeStates, serializeMistakeState } from './practice-review';
import { readStudyData, updateStudyData, type StudyData } from './study-storage';

type StudyBackup = Omit<StudyData, 'version'> & { version: 1 | 2 };

function lessonRecord(lesson: ReturnType<typeof validateLessonProgress>) {
  return lesson && { slug: lesson.slug, input: lesson.input, step: lesson.step };
}

export function exportStudyBackup(): string {
  const data = readStudyData();
  return JSON.stringify({
    version: 2,
    watched: [...new Set(data.watched.filter(getAlgorithm))],
    passed: [...new Set(data.passed.filter(getAlgorithm))],
    lastLesson: lessonRecord(validateLessonProgress(data.lastLesson)),
    mistakes: readMistakeStates(data.mistakes).map(serializeMistakeState),
  } satisfies StudyBackup, null, 2);
}

export function importStudyBackup(text: string): 'success' | 'invalid' | 'storage' {
  let backup: StudyBackup;
  try {
    backup = JSON.parse(text);
  } catch { return 'invalid'; }
  const validSlugs = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((slug) => typeof slug === 'string' && !!getAlgorithm(slug));
  if ((backup?.version !== 1 && backup?.version !== 2) || !validSlugs(backup.watched) || !validSlugs(backup.passed) ||
    !Array.isArray(backup.mistakes)) return 'invalid';
  if (backup.version === 2 && !backup.mistakes.every((record) => {
    const time = (record as { updatedAt?: number } | null)?.updatedAt;
    return typeof time === 'number' && Number.isSafeInteger(time) && time >= 0;
  })) return 'invalid';

  const lesson = validateLessonProgress(backup.lastLesson);
  const imported = restoreMistakeStates(backup.mistakes);
  if ((backup.lastLesson !== null && !lesson) || imported.length !== backup.mistakes.length) return 'invalid';
  if (backup.version === 1 && imported.some((record) => record.choice === null)) return 'invalid';

  const saved = updateStudyData((data) => {
    const mistakes = new Map(restoreMistakeStates(data.mistakes).map((entry) => [entry.id, entry]));
    for (const entry of imported) mergeMistakeState(mistakes, entry);
    return {
      version: 1,
      watched: [...new Set([...data.watched, ...backup.watched])],
      passed: [...new Set([...data.passed, ...backup.passed])],
      lastLesson: lessonRecord(lesson) ?? data.lastLesson,
      mistakes: [...mistakes.values()].map(serializeMistakeState),
    };
  });
  return saved ? 'success' : 'storage';
}
