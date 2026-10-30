import { describe, expect, it } from 'vitest';
import { flipTarget } from '../src/lib/pageFlip';
const lines = Array.from({ length: 20 }, (_, index) => ({ top: 12 + index * 28, bottom: 32 + index * 28 }));
const geometry = { scrollTop: 1000, height: 600, scrollHeight: 10000, lineHeight: 28, lines };
describe('保留两行的按屏翻读', () => {
  it('下一屏顶端保留原末尾两行', () => expect(flipTarget(geometry, 1)).toBe(1000 + lines[18].top - 6));
  it('上一屏底端保留原开头两行', () => expect(flipTarget(geometry, -1)).toBe(1000 + lines[1].bottom - 600 + 6));
  it('首尾不会翻过文档边界', () => {
    expect(flipTarget({ ...geometry, scrollTop: 0 }, -1)).toBe(0);
    expect(flipTarget({ ...geometry, scrollTop: 9400 }, 1)).toBe(9400);
  });
  it('纸张边缘只剩少量文字时仍能前进', () => expect(flipTarget({ ...geometry, lines: lines.slice(0, 2) }, 1)).toBe(1544));
  it('字号、行距与缩放增大时保留的仍为实际两行', () => {
    const scaled = lines.slice(0, 8).map(line => ({ top: line.top * 2.5, bottom: line.bottom * 2.5 }));
    expect(flipTarget({ ...geometry, height: 800, lines: scaled, lineHeight: 70 }, 1)).toBe(1000 + scaled[6].top - 6);
  });
});
