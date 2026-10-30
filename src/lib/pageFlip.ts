export interface TextLine { top: number; bottom: number }
export interface FlipGeometry { scrollTop: number; height: number; scrollHeight: number; lineHeight: number; lines: TextLine[] }

/** 行坐标相对于视口顶部。向后翻把末两行放到顶部，向前翻把首两行放到底部。 */
export function flipTarget(geometry: FlipGeometry, direction: number): number {
  const { scrollTop, height, scrollHeight, lineHeight } = geometry;
  const padding = 6;
  const lines = geometry.lines.filter(line => line.top >= 0 && line.bottom <= height);
  const fallback = Math.max(lineHeight, height - lineHeight * 2);
  let delta = direction > 0 ? fallback : -fallback;
  if (lines.length >= 3) {
    delta = direction > 0 ? lines[lines.length - 2].top - padding : lines[1].bottom - height + padding;
    if (direction * delta < 1) delta = direction > 0 ? fallback : -fallback;
  }
  return Math.max(0, Math.min(Math.max(0, scrollHeight - height), scrollTop + delta));
}
