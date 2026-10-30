import { describe, expect, it } from 'vitest';
import { compileRule, pageForOffset, parseDocument } from '../src/lib/parser';
import { DEFAULT_SETTINGS } from '../src/lib/settings';
import type { TocRule } from '../src/types';
const parse=(text:string,rule:TocRule={mode:'auto',pattern:''})=>parseDocument({text,rule,settings:DEFAULT_SETTINGS});
describe('章节目录',()=>{
  it('识别中文章节与开篇，排除正文提及和列表',()=>{
    const result=parse('书名\n\n序章\n一些正文\n第一章 起点\n我们在第十章里遇见的人。\n1、这是正文列表\n第 １２ 章 雨天\n卷三 山海\n尾声');
    expect(result.chapters.map(c=>c.title)).toEqual(['前言','序章','第一章 起点','第 １２ 章 雨天','卷三 山海','尾声']);
    expect(result.matched).toBe(5);
  });
  it('英文数字、罗马数字、单词序号',()=>expect(parse('Chapter 1 The Beginning\nText\nPART IV A Journey\nChapter Two Home').matched).toBe(3));
  it('没有明确章节时识别数字标题',()=>expect(parse('1、出发\n正文\n二、归来').matched).toBe(2));
  it('自定义捕获组保留字符偏移',()=>{
    const text='介绍\n【第一节】\n正文\n【第二节】';const result=parse(text,{mode:'custom',pattern:'^【(?<title>.+)】$'});
    expect(result.chapters.map(c=>c.title)).toEqual(['前言','第一节','第二节']);
    expect(result.chapters[1].start).toBe(text.indexOf('【第一节】'));
    expect(result.chapters[1].end).toBe(text.indexOf('【第二节】'));
  });
  it('Java 风格的开头行标志转换为 JS 标志',()=>expect(compileRule('(?im)^chapter\\s+\\d+.*$').test('CHAPTER 2 Test')).toBe(true));
  it('支持正则字面量输入',()=>expect(compileRule('/^chapter/i').test('CHAPTER')).toBe(true));
  it('无效与空规则给出错误',()=>{expect(()=>compileRule('[')).toThrow('正则表达式无效');expect(()=>compileRule('')).toThrow('请输入');});
  it('空匹配不生成伪章节',()=>expect(parse('正文\n下一段',{mode:'custom',pattern:'^'}).matched).toBe(0));
  it('无目录时按段落位置分节',()=>{const r=parse(Array.from({length:100},()=> '没有标题的普通正文。'.repeat(10)).join('\n'));expect(r.fallback).toBe(true);expect(r.chapters.length).toBeGreaterThan(1);});
});
describe('分页与定位',()=>{
  it('新卷与新章不预留整段空间或强制换页',()=>{
    const text=Array.from({length:5},(_,i)=>`第${i+1}卷 山海\n第${i+1}章 归途\n这一段正文很短。`).join('\n');
    const r=parse(text);expect(r.matched).toBe(10);expect(r.pages).toHaveLength(1);
    expect(r.pages.flatMap(page=>page.blocks).map(block=>block.text).join('')).toBe(text.replace(/\n/g,''));
  });
  it('长段落分页不丢失字符或拆开 emoji',()=>{
    const text=('这是一段长段落。A word, 🌊 风继续吹。').repeat(1000);
    const r=parse(text);expect(r.pages.length).toBeGreaterThan(5);
    expect(r.pages.flatMap(p=>p.blocks).map(b=>b.text).join('')).toBe(text);
    for(const p of r.pages)for(const b of p.blocks)expect(b.text).not.toMatch(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);
  });
  it('字号增大后重新分页，位置按字符偏移查找',()=>{
    const text='普通段落的一些正文。'.repeat(1500);const normal=parse(text);const large=parseDocument({text,rule:{mode:'auto',pattern:''},settings:{...DEFAULT_SETTINGS,size:24}});
    expect(large.pages.length).toBeGreaterThan(normal.pages.length);
    const offset=7000,index=pageForOffset(large.pages,offset);expect(large.pages[index].start).toBeLessThanOrEqual(offset);expect(large.pages[index+1]?.start??Infinity).toBeGreaterThan(offset);
  });
  it('空文本安全返回',()=>expect(parse('').pages).toEqual([]));
  it('大文本分页保持线性处理速度',()=>{
    const text=Array.from({length:1500},(_,i)=>`第${i+1}章 测试\n${'正文测试，长篇内容。'.repeat(100)}\n`).join('');
    const start=performance.now();const r=parse(text);expect(r.matched).toBe(1500);expect(r.pages.length).toBeGreaterThan(500);expect(performance.now()-start).toBeLessThan(6000);
  });
});
