import { useEffect, useState } from 'react';

export interface AlgorithmReplay { input: number[]; step: number }

export type Route = { name: 'map' } | { name: 'lab' } | { name: 'compare' } | { name: 'algo'; slug: string; replay?: AlgorithmReplay };

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
      const rawInput = params.get('input');
      const rawStep = params.get('step');
      if (rawInput && /^-?\d+(,-?\d+)*$/.test(rawInput) && rawStep && /^\d+$/.test(rawStep)) {
        const input = rawInput.split(',').map(Number);
        const step = Number(rawStep);
        if (Number.isSafeInteger(step) && input.every(Number.isSafeInteger)) return { name: 'algo', slug, replay: { input, step } };
      }
    }
    return { name: 'algo', slug };
  }
  if (h === 'map') return { name: 'map' };
  if (h === 'lab') return { name: 'lab' };
  if (h === 'compare') return { name: 'compare' };
  return { name: 'map' }; // 打开即进算法地图，先看全貌再进具体算法
}

export function navigate(path: string): void {
  window.location.hash = '#/' + path;
}

export function algorithmReplayPath(slug: string, replay: AlgorithmReplay): string {
  const params = new URLSearchParams({ input: replay.input.join(','), step: String(replay.step) });
  return `algo/${slug}?${params}`;
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
