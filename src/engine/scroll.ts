/**
 * 跨路由保持滚动位置。
 * 场景：在左侧目录里连点不同算法时，页面不应回到顶部——否则每换一个都要重新往下翻。
 * 做法：点击前记住 scrollY，切换完成后（layout 阶段、绘制之前）恢复，用户看不到跳动。
 */
let pending: number | null = null;

export function rememberScroll(): void {
  pending = window.scrollY;
}

/** 跨页跳转时调用：丢掉可能残留的待恢复位置，避免下次切换算法时幽灵回跳 */
export function clearScroll(): void {
  pending = null;
}

export function restoreScroll(): void {
  if (pending === null) return;
  const y = pending;
  pending = null;
  if (Math.abs(window.scrollY - y) > 4) window.scrollTo(0, y);
}
