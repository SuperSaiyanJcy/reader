const iconv = require('iconv-lite');
const jschardet = require('jschardet');
const ENCODINGS = ['auto', 'utf-8', 'gb18030', 'big5', 'utf-16le', 'utf-16be'];

/** 优先 BOM 与严格 UTF-8 校验；无 BOM 的旧中文文本再做编码探测。 */
function decodeText(buffer, requested = 'auto') {
  if (!ENCODINGS.includes(requested)) throw new Error('不支持的文本编码');
  let encoding = requested;
  if (encoding === 'auto') {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) encoding = 'utf-16le';
    else if (buffer[0] === 0xfe && buffer[1] === 0xff) encoding = 'utf-16be';
    else {
      // 无 BOM UTF-16 常含大量 0 字节，必须先于 UTF-8 的合法性检测。
      const sample = buffer.subarray(0, 65536);
      let even = 0, odd = 0;
      for (let i = 0; i < sample.length; i++) if (sample[i] === 0) i % 2 ? odd++ : even++;
      if (odd > sample.length * 0.2) encoding = 'utf-16le';
      else if (even > sample.length * 0.2) encoding = 'utf-16be';
      else {
        try { new TextDecoder('utf-8', { fatal: true }).decode(buffer); encoding = 'utf-8'; }
        catch {
          const detected = jschardet.detect(sample).encoding?.toLowerCase();
          encoding = detected === 'utf-16-le' ? 'utf-16le' : detected === 'utf-16-be' ? 'utf-16be' : detected?.includes('big5') ? 'big5' : 'gb18030';
        }
      }
    }
  }
  return { text: iconv.decode(buffer, encoding).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), encoding };
}
module.exports = { decodeText, ENCODINGS };
