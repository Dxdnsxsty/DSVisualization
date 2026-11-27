import { getAlgorithm } from '../algorithms/registry';
import { DEFAULT_INPUT, validateInput } from './input';
import type { AlgorithmReplay } from './router';
import { readStudyData, updateStudyData } from './study-storage';

export interface LessonProgress extends AlgorithmReplay {
  slug: string;
}

export function saveLessonProgress(progress: LessonProgress): void {
  updateStudyData((data) => ({ ...data, lastLesson: progress }));
}

export function validateLessonProgress(value: unknown) {
  try {
    const saved = value as Partial<LessonProgress> | null;
    if (!saved || typeof saved.slug !== 'string' || !Array.isArray(saved.input) ||
      saved.input.length > 99 || !saved.input.every(Number.isSafeInteger) ||
      typeof saved.step !== 'number' || !Number.isSafeInteger(saved.step) || saved.step < 0) return null;

    const algo = getAlgorithm(saved.slug);
    if (!algo || validateInput(algo.input ?? DEFAULT_INPUT, saved.input)) return null;
    const trace = algo.generate(saved.input);
    if (!trace.length) return null;
    // 演示更新后步骤数可能缩短，保留原输入并恢复到仍存在的步骤。
    return { slug: algo.slug, title: algo.title, input: saved.input, step: Math.min(saved.step, trace.length - 1) };
  } catch {
    return null;
  }
}

export function readLessonProgress() {
  return validateLessonProgress(readStudyData().lastLesson);
}
