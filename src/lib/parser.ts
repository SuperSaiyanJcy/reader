import type { Block, Chapter, Page, ParsedDocument, ParseRequest, TocRule } from '../types';

// 独立编写的规则：按标题行匹配，避免把正文中出现的“第几章”识别成目录。
const numerals = '0-9０-９〇零一二两三四五六七八九十百千万亿壹贰叁肆伍陆柒捌玖拾佰仟';
const chinese = new RegExp(`^(?:正文[ \\t　]+)?[【\\[（(]?第[ \\t　]*[${numerals}]{1,16}[ \\t　]*[章回节卷部篇集话](?!课|分|合|和|张).{0,50}$|^[卷章][${numerals}]{1,10}.{0,40}$`, 'u');
const special = /^(?:序章|序言|前言|引言|楔子|引子|终章|后记|尾声|番外)(?:[\s:：、（(].{0,40})?$/u;
const english = /^(?:chapter|part|book|section|episode)\s+(?:\d{1,6}|[ivxlcdm]{1,12}|one|two|three|four|five|six|seven|eight|nine|ten)\b.{0,60}$/iu;
const numbered = new RegExp(`^(?:[0-9]{1,6}|[${numerals}]{1,10})[、.．:：][ \\t　]*.{1,45}$`, 'u');

export function compileRule(pattern: string): RegExp {
  if (!pattern.trim()) throw new Error('请输入正则表达式');
  if (pattern.length > 1000) throw new Error('表达式不能超过 1000 个字符');
  let source = pattern.trim();
  let flags = 'u';
  const literal = source.match(/^\/(.*)\/([imu]*)$/s);
  if (literal) { source = literal[1]; flags = [...new Set(`${literal[2]}u`)].join(''); }
  const inline = source.match(/^\(\?([im]+)\)/);
  if (inline) { flags = [...new Set(`${flags}${inline[1]}`)].join(''); source = source.slice(inline[0].length); }
  try { return new RegExp(source, flags); }
  catch { throw new Error('正则表达式无效，请检查括号、方括号和转义字符'); }
}

interface Line { text: string; start: number; heading: boolean }
function linesOf(text: string): Line[] {
  const lines: Line[] = [];
  const re = /[^\n]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed) lines.push({ text: trimmed, start: match.index + raw.indexOf(trimmed), heading: false });
  }
  return lines;
}
function matchChapters(lines: Line[], textLength: number, rule: TocRule) {
  const regex = rule.mode === 'custom' ? compileRule(rule.pattern) : null;
  const candidates: { line: Line; title: string; family: string }[] = [];
  for (const line of lines) {
    if (line.text.length > (regex ? 500 : 90)) continue;
    let title = line.text, family = '';
    if (regex) {
      const match = regex.exec(line.text);
      if (match && match[0].length) { family = 'custom'; title = (match.groups?.title || match[1] || line.text).trim() || line.text; }
    } else if ((rule.mode === 'auto' || rule.mode === 'chinese') && chinese.test(line.text)) family = 'chinese';
    else if ((rule.mode === 'auto' || rule.mode === 'english') && english.test(line.text)) family = 'english';
    else if ((rule.mode === 'auto' || rule.mode === 'chinese') && special.test(line.text)) family = 'special';
    else if ((rule.mode === 'auto' || rule.mode === 'number') && numbered.test(line.text)) family = 'number';
    if (family) candidates.push({ line, title, family });
  }
  // 已有明确章节时，自动模式忽略“1、”等正文列表，减少误识别。
  const explicit = candidates.some(item => item.family === 'chinese' || item.family === 'english');
  const selected = candidates.filter(item => !(rule.mode === 'auto' && explicit && item.family === 'number'));
  const chapters: Chapter[] = selected.map(({ line, title }) => { line.heading = true; return { title, start: line.start, end: textLength }; });
  const matched = chapters.length;
  if (chapters.length && lines[0]?.start < chapters[0].start) chapters.unshift({ title: '前言', start: lines[0].start, end: chapters[0].start, synthetic: true });
  if (!chapters.length && lines.length) {
    let next = 0;
    for (const line of lines) if (line.start >= next) { chapters.push({ title: `第 ${chapters.length + 1} 节`, start: line.start, end: textLength, synthetic: true }); next = line.start + 6000; }
  }
  chapters.forEach((chapter, index) => { chapter.end = chapters[index + 1]?.start ?? textLength; });
  return { chapters, matched, fallback: matched === 0 };
}

/** 按大致文字高度分块用于虚拟渲染；分块间连续衔接，章节标题不产生强制分页。 */
function paginate(lines: Line[], size: number, lineHeight: number, indent: boolean): Page[] {
  const em = size * 4 / 3;
  const width = 618 / em;
  const capacity = Math.max(5, Math.floor(900 / (em * lineHeight)));
  const pages: Page[] = [];
  let blocks: Block[] = [], used = 0;
  const flush = () => {
    if (!blocks.length) return;
    const last = blocks[blocks.length - 1];
    pages.push({ start: blocks[0].start, end: last.start + last.text.length, blocks });
    blocks = []; used = 0;
  };
  for (const line of lines) {
    let cursor = 0, first = true;
    while (cursor < line.text.length) {
      const heading = line.heading;
      const scale = heading ? 1.12 : 1;
      const available = Math.floor((capacity - used) / scale);
      if (available < 1) { flush(); continue; }
      let row = 1, col = !heading && indent && first ? 2 : 0;
      let end = cursor;
      for (const char of line.text.slice(cursor)) {
        const weight = /[\u0000-\u007f]/.test(char) ? 0.58 : 1;
        if (col + weight > width / (heading ? 1.12 : 1)) { if (row >= available) break; row++; col = 0; }
        col += weight; end += char.length;
      }
      if (end === cursor) end += line.text.codePointAt(cursor)! > 0xffff ? 2 : 1;
      blocks.push({ text: line.text.slice(cursor, end), start: line.start + cursor, heading, continued: !first });
      used += row * scale + (heading ? 0.65 * scale : 0.7) / lineHeight;
      cursor = end; first = false;
      if (cursor < line.text.length) flush();
    }
  }
  flush();
  return pages;
}

export function parseDocument(request: ParseRequest): ParsedDocument {
  const lines = linesOf(request.text);
  const toc = matchChapters(lines, request.text.length, request.rule);
  return { ...toc, pages: request.preview ? [] : paginate(lines, request.settings.size, request.settings.lineHeight, request.settings.indent), wordCount: request.preview ? 0 : request.text.replace(/\s/g, '').length };
}
export function pageForOffset(pages: Page[], offset: number) {
  let low = 0, high = pages.length - 1;
  while (low < high) { const middle = Math.ceil((low + high) / 2); if (pages[middle].start <= offset) low = middle; else high = middle - 1; }
  return low;
}
