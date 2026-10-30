import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ParsedDocument, Settings } from '../types';
import { fontFamilyFor } from '../lib/settings';
import { pageForOffset } from '../lib/parser';
import { flipTarget, type TextLine } from '../lib/pageFlip';
export interface ReaderApi { jump(offset: number): void; step(delta: number): void; offset(): number }
export default function ReaderView({ doc, settings: s, initialOffset, onPosition, onApi, search }: { doc: ParsedDocument; settings: Settings; initialOffset: number; onPosition: (offset: number, page: number) => void; onApi: (api: ReaderApi) => void; search: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const heights = useRef(new Map<number, number>());
  const zoom = s.zoom / 100;
  const lastOffset = useRef(initialOffset);
  const jumpTarget = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  // pages 仅用于长文本分块和定位；相邻分块拼成连续白纸，不制造可见分页或补齐页高。
  const virtualizer = useVirtualizer({ count: doc.pages.length, getScrollElement: () => viewport.current, estimateSize: index => (heights.current.get(index) ?? 900) * zoom, measureElement: element => element.getBoundingClientRect().height, overscan: 2 });
  const jump = useCallback((offset: number) => {
    const index = pageForOffset(doc.pages, offset);
    jumpTarget.current = offset;
    lastOffset.current = offset;
    onPosition(offset, index);
    virtualizer.scrollToIndex(index, { align: 'start' });
    // 在虚拟页挂载后按块偏移定位，章节标题可落在页面中部。
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const page = viewport.current?.querySelector<HTMLElement>(`[data-page="${index}"]`);
      const blocks = page ? [...page.querySelectorAll<HTMLElement>('[data-offset]')] : [];
      const block = blocks.findLast(item => Number(item.dataset.offset) <= offset);
      if (block && viewport.current) {
        const delta = block.getBoundingClientRect().top - viewport.current.getBoundingClientRect().top - 42;
        if (delta > 120 * zoom) viewport.current.scrollTop += delta;
      }
    }));
    lastOffset.current = offset;
  }, [doc, virtualizer, zoom, onPosition]);
  const step = useCallback((direction: number) => {
    const element = viewport.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const lines: TextLine[] = [];
    // Range 返回当前字体真实排版后的文字行矩形，跨段落、跨纸张也保留实际内容行。
    for (const block of element.querySelectorAll<HTMLElement>('[data-offset]')) {
      const blockBounds = block.getBoundingClientRect();
      if (blockBounds.bottom < bounds.top || blockBounds.top > bounds.bottom) continue;
      const range = document.createRange();
      range.selectNodeContents(block);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && rect.height > 0) lines.push({ top: rect.top - bounds.top, bottom: rect.bottom - bounds.top });
      }
    }
    lines.sort((a, b) => a.top - b.top);
    const unique = lines.filter((line, index) => !index || Math.abs(line.top - lines[index - 1].top) > 1);
    const paragraph = element.querySelector('.paper p');
    const lineHeight = paragraph ? parseFloat(getComputedStyle(paragraph).lineHeight) * zoom : s.size * 4 / 3 * s.lineHeight * zoom;
    const top = flipTarget({ scrollTop: element.scrollTop, height: element.clientHeight, scrollHeight: element.scrollHeight, lineHeight, lines: unique }, direction);
    jumpTarget.current = null;
    virtualizer.scrollToOffset(top, { align: 'start', behavior: 'auto' });
  }, [virtualizer, zoom, s.size, s.lineHeight]);
  useEffect(() => {
    onApi({ jump, step, offset: () => lastOffset.current });
  }, [jump, step, onApi]);
  useEffect(() => {
    heights.current.clear(); virtualizer.measure();
    const frame = requestAnimationFrame(() => { jump(initialOffset); setMounted(true); });
    return () => cancelAnimationFrame(frame);
  }, [doc]); // 文档重排通过原始字符偏移恢复位置。
  useEffect(() => {
    let cancelled = false;
    const keep = lastOffset.current;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      heights.current.clear();virtualizer.measure();
      requestAnimationFrame(() => { if (!cancelled) jump(keep); });
    });
    return () => { cancelled = true; };
  }, [zoom, s.font]);
  const position = () => {
    if (jumpTarget.current !== null) { onPosition(jumpTarget.current, pageForOffset(doc.pages, jumpTarget.current)); return; }
    const top = viewport.current?.scrollTop ?? 0;
    const item = virtualizer.getVirtualItems().find(item => item.end > top + 100 * zoom);
    if (!item) return;
    const page = doc.pages[item.index];
    if (!page) return;
    const ratio = Math.max(0, Math.min(1, (top - item.start - 22) / Math.max(1, item.size)));
    let offset = Math.round(page.start + (page.end - page.start) * ratio);
    const edge = (viewport.current?.getBoundingClientRect().top ?? 0) + 80 * zoom;
    const visible = [...(viewport.current?.querySelectorAll<HTMLElement>('[data-offset]') ?? [])].find(block => block.getBoundingClientRect().bottom > edge);
    if (visible) {
      const rect = visible.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (edge - rect.top) / Math.max(1, rect.height)));
      offset = Number(visible.dataset.offset) + Math.floor((visible.textContent?.length ?? 0) * fraction);
    }
    lastOffset.current = offset; onPosition(offset, item.index);
  };
  function highlighted(text: string) {
    if (!search.trim()) return text;
    const needle = search.toLocaleLowerCase(); const lower = text.toLocaleLowerCase();
    const parts = []; let from = 0, at = lower.indexOf(needle);
    while (at >= 0 && parts.length < 100) { parts.push(text.slice(from, at), <mark key={at}>{text.slice(at, at + needle.length)}</mark>); from = at + needle.length; at = lower.indexOf(needle, from); }
    parts.push(text.slice(from)); return parts;
  }
  return <div className="document-scroll" ref={viewport} onScroll={position} onWheel={() => { jumpTarget.current = null; }} onPointerDown={() => { jumpTarget.current = null; }} onKeyDown={() => { jumpTarget.current = null; }} tabIndex={0} aria-label="文档正文" style={{ opacity: mounted ? 1 : 0 }}>
    <div className="page-track" style={{ height: virtualizer.getTotalSize() + 44, minWidth: 794 * zoom + 72 }}>
      {virtualizer.getVirtualItems().map(item => <div key={item.key} data-index={item.index} data-page={item.index} ref={virtualizer.measureElement} className="page-holder" style={{ width: 794 * zoom, height: (heights.current.get(item.index) ?? 900) * zoom, transform: `translate(-50%, ${item.start + 22}px)` }}>
        <div className={`paper ${item.index === 0 ? 'paper-first' : ''} ${item.index === doc.pages.length - 1 ? 'paper-last' : ''}`} ref={element => { if (!element) return; const height = element.getBoundingClientRect().height / zoom; if (heights.current.get(item.index) !== height) { heights.current.set(item.index, height); const holder = element.parentElement!; holder.style.height = `${height * zoom}px`; virtualizer.measureElement(holder); } }} style={{ transform: `scale(${zoom})`, fontFamily: fontFamilyFor(s.font), fontSize: `${s.size * 4 / 3}px`, lineHeight: s.lineHeight, fontWeight: s.bold ? 700 : 400, fontStyle: s.italic ? 'italic' : 'normal', textDecoration: s.underline ? 'underline' : 'none', color: s.color, textAlign: s.align }}>
          {item.index === 0 && <><div className="crop top-left"/><div className="crop top-right"/></>}
          {doc.pages[item.index].blocks.map((block, index, blocks) => {
            const continues = index === blocks.length - 1 && doc.pages[item.index + 1]?.blocks[0]?.continued;
            return block.heading ? <h2 key={block.start} data-offset={block.start} style={{ marginBottom: continues ? 0 : undefined }}>{highlighted(block.text)}</h2> : <p key={block.start} data-offset={block.start} style={{ textIndent: s.indent && !block.continued ? '2em' : 0, marginBottom: continues ? 0 : undefined }}>{highlighted(block.text)}</p>;
          })}
        </div>
      </div>)}
    </div>
  </div>;
}
