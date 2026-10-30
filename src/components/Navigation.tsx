import { useEffect, useRef } from 'react';
import { ChevronDown, Search, Settings2, X } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ParsedDocument } from '../types';
export interface SearchResult { start: number; excerpt: string }
export default function Navigation({ doc, active, jump, close, rules, query, setQuery, results, focusKey, section, setSection }: { doc: ParsedDocument; active: number; jump: (offset:number)=>void; close: ()=>void; rules:()=>void; query:string; setQuery:(s:string)=>void; results:SearchResult[]; focusKey:number; section:string; setSection:(s:string)=>void }) {
  const list = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null);
  const rows = section === '结果' ? results : doc.chapters;
  const virtualizer = useVirtualizer({count:rows.length,getScrollElement:()=>list.current,estimateSize:()=>section === '结果' ? 66 : 38,overscan:8});
  useEffect(() => { if (focusKey) { input.current?.focus(); input.current?.select(); } },[focusKey]);
  useEffect(() => { if (section === '标题' && active >= 0) virtualizer.scrollToIndex(active, {align:'auto'}); },[active, section]);
  return <aside className="navigation" id="document-navigation"><div className="nav-heading"><span>导航</span><div><button title="导航选项" onClick={rules}><ChevronDown size={13}/></button><button title="关闭导航窗格" aria-label="关闭导航窗格" onClick={close}><X size={16}/></button></div></div>
    <div className="nav-search"><input ref={input} aria-label="搜索文档" placeholder="搜索文档" value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value) setSection('结果');}}/><button title={query ? '清除搜索' : '搜索'} onClick={()=>setQuery('')}>{query ? <X size={14}/> : <Search size={15}/>}</button></div>
    <div className="nav-tabs">{['标题','页面','结果'].map(tab=><button key={tab} className={section===tab?'active':''} onClick={()=>setSection(tab)}>{tab}</button>)}</div>
    {section === '页面' ? <div className="page-thumbnails">{doc.pages.slice(0,300).map((page,i)=><button key={i} onClick={()=>jump(page.start)}><div><i/><i/><i/><i/><i/><i/><i/><i/></div><span>{i+1}</span></button>)}{doc.pages.length>300&&<p>仅预览前 300 页，使用目录可跳转全文。</p>}</div> : <>
    <div className="nav-summary">{section==='结果'?(query?`找到 ${results.length}${results.length===500?'＋':''} 个结果`:'输入文字以搜索文档'):doc.fallback?'未识别到章节，已按长度分节':`文档标题 · ${doc.chapters.length} 项`}</div>
    <div className="nav-list" ref={list}><div style={{height:virtualizer.getTotalSize(),position:'relative'}}>{virtualizer.getVirtualItems().map(item=>section==='结果'?<button className="search-result" key={item.key} style={{transform:`translateY(${item.start}px)`}} onClick={()=>jump(results[item.index].start)}><span>{item.index+1}</span><p>{results[item.index].excerpt}</p></button>:<button key={item.key} title={doc.chapters[item.index].title} className={`toc-item ${active===item.index?'current':''}`} style={{transform:`translateY(${item.start}px)`}} onClick={()=>jump(doc.chapters[item.index].start)}><span className="toc-caret">›</span><span>{doc.chapters[item.index].title}</span></button>)}</div></div>
    </>}
    <div className="nav-bottom"><button onClick={rules}><Settings2 size={14}/>目录选项</button><span>{doc.matched ? '自动保存进度' : '可自定义规则'}</span></div>
  </aside>;
}
