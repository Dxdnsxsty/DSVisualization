import { useEffect, useState } from 'react';

export interface AlgorithmReplay { input: number[]; step: number }
export interface ExerciseReplay extends AlgorithmReplay { slug: string }
export interface ComparisonReplay { left: string; right: string; input: number[]; steps: [number, number] }

export type Route = { name: 'map' } | { name: 'lab'; exercise?: ExerciseReplay } |
  { name: 'compare'; comparison?: ComparisonReplay } |
  { name: 'algo'; slug: string; replay?: AlgorithmReplay; comparison?: ComparisonReplay };

function readReplay(params: URLSearchParams): AlgorithmReplay | undefined {
  const rawInput = params.get('input');
  const rawStep = params.get('step');
  if (!rawInput || !/^-?\d+(,-?\d+)*$/.test(rawInput) || !rawStep || !/^\d+$/.test(rawStep)) return;
  const input = rawInput.split(',').map(Number);
  const step = Number(rawStep);
  if (Number.isSafeInteger(step) && input.every(Number.isSafeInteger)) return { input, step };
}

function readComparison(params: URLSearchParams): ComparisonReplay | undefined {
  const left = params.get('left');
  const right = params.get('right');
  const replay = readReplay(params);
  const other = params.get('rightStep');
  if (!left || !right || !replay || !other || !/^\d+$/.test(other)) return;
  const rightStep = Number(other);
  if (Number.isSafeInteger(rightStep)) return { left, right, input: replay.input, steps: [replay.step, rightStep] };
}

/** hash 路由：纯静态托管无需服务器 rewrite，链接可直接分享给同学。 */
export function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const queryAt = hash.indexOf('?');
  let h: string;
  try {
    h = decodeURIComponent(queryAt === -1 ? hash : hash.slice(0, queryAt));
  } catch {
    // 畸形编码（如 #/%E0%A4%A）会让 decodeURIComponent 抛 URIError，
    // 这里直接回退到地图页，避免整页白屏。
    return { name: 'map' };
  }
  if (h.startsWith('algo/')) {
    const slug = h.slice(5);
    if (queryAt !== -1) {
      const params = new URLSearchParams(hash.slice(queryAt + 1));
      const replay = readReplay(params);
      if (replay) {
        const from = params.get('comparison');
        const comparison = from ? readComparison(new URLSearchParams(from)) : undefined;
        return comparison ? { name: 'algo', slug, replay, comparison } : { name: 'algo', slug, replay };
      }
    }
    return { name: 'algo', slug };
  }
  if (h === 'map') return { name: 'map' };
  if (h === 'lab') {
    if (queryAt !== -1) {
      const params = new URLSearchParams(hash.slice(queryAt + 1));
      const slug = params.get('algo');
      const replay = readReplay(params);
      if (slug && replay) return { name: 'lab', exercise: { slug, ...replay } };
    }
    return { name: 'lab' };
  }
  if (h === 'compare') {
    const comparison = queryAt === -1 ? undefined : readComparison(new URLSearchParams(hash.slice(queryAt + 1)));
    return comparison ? { name: 'compare', comparison } : { name: 'compare' };
  }
  return { name: 'map' }; // 打开即进算法地图，先看全貌再进具体算法
}

export function navigate(path: string): void {
  window.location.hash = '#/' + path;
}

export function algorithmReplayPath(slug: string, replay: AlgorithmReplay, comparison?: ComparisonReplay): string {
  const params = new URLSearchParams({ input: replay.input.join(','), step: String(replay.step) });
  if (comparison) params.set('comparison', comparisonParams(comparison).toString());
  return `algo/${slug}?${params}`;
}

function comparisonParams({ left, right, input, steps }: ComparisonReplay): URLSearchParams {
  return new URLSearchParams({ left, right, input: input.join(','), step: String(steps[0]), rightStep: String(steps[1]) });
}

export function comparisonReplayPath(comparison: ComparisonReplay): string {
  return 'compare?' + comparisonParams(comparison);
}

export function exerciseReplayPath({ slug, input, step }: ExerciseReplay): string {
  return 'lab?' + new URLSearchParams({ algo: slug, input: input.join(','), step: String(step) });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
