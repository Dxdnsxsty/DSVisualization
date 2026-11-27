import { getAlgorithm } from '../algorithms/registry';
import { validateLessonProgress } from './learning-progress';
import { restorePracticeMistakes, serializeMistakes } from './practice-review';
import { readStudyData, updateStudyData, type StudyData } from './study-storage';

function lessonRecord(lesson: ReturnType<typeof validateLessonProgress>) {
  return lesson && { slug: lesson.slug, input: lesson.input, step: lesson.step };
}

export function exportStudyBackup(): string {
  const data = readStudyData();
  return JSON.stringify({
    version: 1,
    watched: [...new Set(data.watched.filter(getAlgorithm))],
    passed: [...new Set(data.passed.filter(getAlgorithm))],
    lastLesson: lessonRecord(validateLessonProgress(data.lastLesson)),
    mistakes: serializeMistakes(restorePracticeMistakes(data.mistakes)),
  } satisfies StudyData, null, 2);
}

export function importStudyBackup(text: string): 'success' | 'invalid' | 'storage' {
  let backup: StudyData;
  try {
    backup = JSON.parse(text);
  } catch { return 'invalid'; }
  const validSlugs = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((slug) => typeof slug === 'string' && !!getAlgorithm(slug));
  if (backup?.version !== 1 || !validSlugs(backup.watched) || !validSlugs(backup.passed) ||
    !Array.isArray(backup.mistakes)) return 'invalid';

  const lesson = validateLessonProgress(backup.lastLesson);
  const imported = restorePracticeMistakes(backup.mistakes);
  if ((backup.lastLesson !== null && !lesson) || imported.length !== backup.mistakes.length) return 'invalid';

  const saved = updateStudyData((data) => {
    const mistakes = new Map(restorePracticeMistakes(data.mistakes).map((entry) => [entry.id, entry]));
    for (const entry of imported) if (!mistakes.has(entry.id)) mistakes.set(entry.id, entry);
    return {
      version: 1,
      watched: [...new Set([...data.watched, ...backup.watched])],
      passed: [...new Set([...data.passed, ...backup.passed])],
      lastLesson: lessonRecord(lesson) ?? data.lastLesson,
      mistakes: serializeMistakes([...mistakes.values()]),
    };
  });
  return saved ? 'success' : 'storage';
}
