import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { fontFamilyFor, isCustomFont } from '../src/lib/settings';
const require = createRequire(import.meta.url);
const { validateTtf, fontMeta, validFontMeta } = require('../electron/fonts.cjs');
function fontHeader() {
  const data = Buffer.alloc(60);
  data.writeUInt32BE(0x00010000);data.writeUInt16BE(3, 4);
  ['head','cmap','maxp'].forEach((tag, index) => data.write(tag, 12 + index * 16, 'ascii'));
  return data;
}
describe('本地 TTF 字体', () => {
  it('校验 TrueType 标志与必要表', () => expect(() => validateTtf(fontHeader())).not.toThrow());
  it('拒绝伪装为 TTF 的文本与截断字体', () => {
    expect(() => validateTtf(Buffer.from('not a real ttf font file'))).toThrow('有效');
    const data = fontHeader();data.writeUInt32BE(1000000, 20);
    expect(() => validateTtf(data)).toThrow('不完整');
  });
  it('同一文件按内容去重，保留可读文件名', () => {
    const a = fontMeta(fontHeader(), '/fonts/阅读字体.ttf');
    const b = fontMeta(fontHeader(), '/elsewhere/copy.TTF');
    expect(a.id).toBe(b.id);expect(a.name).toBe('阅读字体');expect(validFontMeta(a)).toBe(true);
  });
  it('只允许应用生成的字体族标识', () => {
    expect(isCustomFont('ReaderFont_' + 'a'.repeat(24))).toBe(true);
    expect(isCustomFont('ReaderFont_../../file')).toBe(false);
    expect(fontFamilyFor('missing-font')).toContain('Songti SC');
    expect(validFontMeta({ id:'../file',name:'x',family:'ReaderFont_../file' })).toBe(false);
  });
});
