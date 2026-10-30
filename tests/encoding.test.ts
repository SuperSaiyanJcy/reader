import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require=createRequire(import.meta.url);
const {decodeText}=require('../electron/encoding.cjs');
const iconv=require('iconv-lite');
describe('TXT 编码',()=>{
  const text='第一章 你好世界\n繁體中文測試';
  for(const encoding of ['utf-8','utf-16le','utf-16be','gb18030','big5'])it(`手动解码 ${encoding}`,()=>expect(decodeText(iconv.encode(text,encoding),encoding).text).toBe(text));
  for(const encoding of ['utf-8','utf-16le','utf-16be'])it(`自动识别 ${encoding}`,()=>expect(decodeText(iconv.encode(text,encoding), 'auto').text).toBe(text));
  it('自动读取 GBK 并统一换行',()=>expect(decodeText(iconv.encode('第一章 中文小说测试\r\n这是中国文字的测试内容，欢迎阅读。','gbk')).text).toBe('第一章 中文小说测试\n这是中国文字的测试内容，欢迎阅读。'));
  it('移除 BOM',()=>expect(decodeText(Buffer.from('\ufeff第一章','utf8')).text).toBe('第一章'));
  it('非法编码无法进入解码器',()=>expect(()=>decodeText(Buffer.from('hello'),'not-an-encoding')).toThrow('不支持'));
});
