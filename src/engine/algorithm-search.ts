import type { AlgorithmMeta } from './types';

function normalizeSearch(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/[\p{Dash_Punctuation}−]+/gu, ' ');
}

export function matchesAlgorithm(algo: AlgorithmMeta, chapter: string, query: string, translate?: (value: string) => string): boolean {
  const keywords = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!keywords.length) return true;
  const labels = [algo.title, algo.summary, chapter];
  const text = normalizeSearch([algo.slug, ...labels, ...(translate ? labels.map(translate) : [])].join(' '));
  return keywords.every((word) => text.includes(word));
}
