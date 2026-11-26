import type { AlgorithmMeta } from './types';

export function matchesAlgorithm(algo: AlgorithmMeta, chapter: string, query: string): boolean {
  const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = [algo.slug, algo.title, algo.summary, chapter].join(' ').toLowerCase();
  return keywords.every((word) => text.includes(word));
}
