const path = require('node:path');
const { createHash } = require('node:crypto');

const MAX_FONT_BYTES = 32 * 1024 * 1024;
const FONT_ID = /^[a-f0-9]{24}$/;

/** 校验 TrueType 的 sfnt 表目录；最终字形解码由 Chromium 的字体加载器验证。 */
function validateTtf(buffer) {
  if (buffer.length < 12 || buffer.length > MAX_FONT_BYTES) throw new Error('字体文件为空、损坏或超过 32 MB');
  if (buffer.readUInt32BE(0) !== 0x00010000 && buffer.toString('ascii', 0, 4) !== 'true') throw new Error('请选择有效的 TrueType（.ttf）字体文件');
  const count = buffer.readUInt16BE(4);
  if (!count || count > 4096 || 12 + count * 16 > buffer.length) throw new Error('字体表目录不完整，请更换字体文件');
  const tables = new Set();
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16;
    const offset = buffer.readUInt32BE(at + 8), length = buffer.readUInt32BE(at + 12);
    if (offset + length > buffer.length) throw new Error('字体数据不完整，请更换字体文件');
    tables.add(buffer.toString('ascii', at, at + 4));
  }
  if (!['head', 'cmap', 'maxp'].every(table => tables.has(table))) throw new Error('字体缺少必要的 TrueType 数据表');
}
function fontMeta(buffer, filePath) {
  const id = createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  return { id, name: path.basename(filePath, path.extname(filePath)).slice(0, 120), family: `ReaderFont_${id}` };
}
function validFontMeta(font) {
  return font && FONT_ID.test(font.id) && typeof font.name === 'string' && font.name.length > 0 && font.family === `ReaderFont_${font.id}`;
}
module.exports = { MAX_FONT_BYTES, FONT_ID, validateTtf, fontMeta, validFontMeta };
