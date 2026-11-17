import { useEffect, useState } from 'react';

export type Route = { name: 'map' } | { name: 'lab' } | { name: 'compare' } | { name: 'algo'; slug: string };

/** hash 路由：纯静态托管无需服务器 rewrite，链接可直接分享给同学。 */
export function parseHash(): Route {
  let h: string;
  try {
    h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  } catch {
    // 畸形编码（如 #/%E0%A4%A）会让 decodeURIComponent 抛 URIError，
    // 这里直接回退到地图页，避免整页白屏。
    return { name: 'map' };
  }
  if (h.startsWith('algo/')) return { name: 'algo', slug: h.slice(5) };
  if (h === 'map') return { name: 'map' };
  if (h === 'lab') return { name: 'lab' };
  if (h === 'compare') return { name: 'compare' };
  return { name: 'map' }; // 打开即进算法地图，先看全貌再进具体算法
}

export function navigate(path: string): void {
  window.location.hash = '#/' + path;
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
