import { getAlgorithm } from '../algorithms/registry';
import { DEFAULT_INPUT, validateInput } from './input';
import type { AlgorithmReplay } from './router';

const KEY = 'dsv-last-lesson';

interface LessonProgress extends AlgorithmReplay {
  slug: string;
}

export function saveLessonProgress(progress: LessonProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch { /* 浏览器禁用存储时，演示仍可正常播放。 */ }
}

export function readLessonProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved: Partial<LessonProgress> | null = JSON.parse(raw);
    if (!saved || typeof saved.slug !== 'string' || !Array.isArray(saved.input) ||
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
