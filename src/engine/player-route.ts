import { usePlayer } from './player';
import { saveLessonProgress } from './learning-progress';
import { parseHash, type AlgorithmReplay } from './router';

function isVisibleAlgorithm(slug: string): boolean {
  const route = parseHash();
  return route.name === 'algo' && route.slug === slug;
}

export function syncPlayerRoute(slug: string, replay?: AlgorithmReplay): void {
  const player = usePlayer.getState();
  if (slug) player.load(slug, replay);
  const current = usePlayer.getState();
  if ((!slug || current.slug !== slug) && current.playing) current.setPlaying(false);
}

export function schedulePlayerAdvance(slug: string): (() => void) | undefined {
  const frame = usePlayer.getState();
  if (!slug || frame.slug !== slug || !frame.playing || frame.step >= frame.trace.length - 1) return;

  const timer = window.setTimeout(() => {
    const current = usePlayer.getState();
    // hashchange 或 React 的清理尚未执行时，也不能推进旧页面或旧轨迹。
    if (!isVisibleAlgorithm(slug) || current.slug !== slug || !current.playing ||
      current.trace !== frame.trace || current.step !== frame.step || current.speed !== frame.speed) return;
    current.next();
  }, Math.max(120, 760 / frame.speed));
  return () => window.clearTimeout(timer);
}

export function completedPlayerSlug(slug: string): string | undefined {
  const { slug: loaded, trace, step } = usePlayer.getState();
  if (slug && slug === loaded && isVisibleAlgorithm(slug) && trace.length > 0 && step === trace.length - 1) return slug;
}

export function saveVisiblePlayerProgress(slug: string): void {
  const { slug: loaded, input, trace, step } = usePlayer.getState();
  if (slug && slug === loaded && trace[step] && isVisibleAlgorithm(slug)) {
    saveLessonProgress({ slug, input, step });
  }
}
