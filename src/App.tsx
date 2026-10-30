import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, FileText, LoaderCircle, MessageSquare, Minus, PanelLeft, Plus, Redo2, Save, Search, Share2, ShieldCheck, Undo2, X } from 'lucide-react';
import type { Book, BookMeta, CustomFont, ParsedDocument, Settings, TocRule } from './types';
import { DEFAULT_SETTINGS, isCustomFont, loadSettings } from './lib/settings';
import { registerFont, unregisterFont } from './lib/fonts';
import { parseDocument, pageForOffset } from './lib/parser';
import { parseAsync } from './lib/parseAsync';
import { COVER_TEXT } from './lib/cover';
import Ribbon from './components/Ribbon';
import ReaderView from './components/ReaderView';
import type { ReaderApi } from './components/ReaderView';
import Navigation from './components/Navigation';
import type { SearchResult } from './components/Navigation';
import RulesDialog from './components/RulesDialog';
import Backstage from './components/Backstage';

export default function App() {
  const [settings,setSettings]=useState(loadSettings);
  const [book,setBook]=useState<Book|null>(null),[recent,setRecent]=useState<BookMeta[]>([]);
  const [doc,setDoc]=useState<ParsedDocument|null>(null),[rule,setRule]=useState<TocRule>({mode:'auto',pattern:''});
  const [tab,setTab]=useState('开始'),[file,setFile]=useState(false),[rules,setRules]=useState(false);
  const [cover,setCover]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [offset,setOffset]=useState(0),[page,setPage]=useState(0),[query,setQuery]=useState(''),[focusKey,setFocusKey]=useState(0),[section,setSection]=useState('标题');
  const [platform,setPlatform]=useState('darwin');
  const [fonts,setFonts]=useState<CustomFont[]>([]),[fontBusy,setFontBusy]=useState(false);
  const api=useRef<ReaderApi|null>(null),offsetRef=useRef(0),initialOffset=useRef(0),started=useRef(false),opening=useRef(false);
  const live=useRef({book,cover,rule,ready:!!doc});live.current={book,cover,rule,ready:!!doc};
  const update=useCallback((value:Partial<Settings>)=>setSettings(s=>({...s,...value})),[]);
  useEffect(()=>{localStorage.setItem('reader.settings',JSON.stringify(settings));},[settings]);
  const flush=useCallback(()=>{const {book,cover,rule,ready}=live.current;if(book&&!cover&&ready)void window.reader?.progress({id:book.id,offset:offsetRef.current,rule}).catch(()=>{});},[]);
  const accept=useCallback((next:Book)=>{
    flush();initialOffset.current=next.offset||0;offsetRef.current=next.offset||0;setOffset(next.offset||0);setBook(next);setRule(next.rule??{mode:'auto',pattern:''});setCover(false);setFile(false);setQuery('');setSection('标题');setDoc(null);
    void window.reader?.library().then(library=>setRecent(library.recent));
  },[flush]);
  const action=useCallback(async(fn:()=>Promise<Book|null|undefined>)=>{
    if(opening.current)return;opening.current=true;setError('');
    try {const next=await fn();if(next)accept(next);}catch(e){setError((e as Error).message);}finally{opening.current=false;}
  },[accept]);
  const open=useCallback(()=>{if(window.reader)void action(()=>window.reader!.open());else setError('请使用 Reader 桌面应用打开本地 TXT。');},[action]);
  const loadRecent=useCallback((id:string)=>{void action(()=>window.reader!.recent(id));},[action]);
  const sample=useCallback(()=>{if(window.reader)void action(()=>window.reader!.sample());},[action]);
  useEffect(()=>{
    if(started.current)return;started.current=true;
    window.reader?.library().then(async library=>{
      setRecent(library.recent);setPlatform(library.platform);
      const results=await Promise.allSettled((library.fonts??[]).map(font=>window.reader!.font(font.id).then(registerFont)));
      const available=results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
      setFonts(available);
      setSettings(current=>isCustomFont(current.font)&&!available.some(font=>font.family===current.font)?{...current,font:DEFAULT_SETTINGS.font}:current);
      if(results.some(result=>result.status==='rejected'))setError('部分自定义字体无法加载，请重新导入。');
      if(library.lastId)void action(()=>window.reader!.recent(library.lastId!));
    }).catch(e=>setError(e.message));
  },[action]);
  const importFont=async()=>{
    if(!window.reader||opening.current)return;
    opening.current=true;setFontBusy(true);flush();
    let imported:CustomFont|null=null;
    try{
      const data=await window.reader.importFont();
      if(!data)return;
      imported=data;
      const font=await registerFont(data);
      setFonts(current=>current.some(item=>item.id===font.id)?current:[...current,font]);
      update({font:font.family});
    }catch(e){
      if(imported&&!fonts.some(font=>font.id===imported!.id))await window.reader.removeFont(imported.id).catch(()=>{});
      setError((e as Error).message);
    }finally{opening.current=false;setFontBusy(false);}
  };
  const removeFont=async(id:string)=>{
    const font=fonts.find(item=>item.id===id);
    try{
      await window.reader?.removeFont(id);
      if(settings.font===font?.family)update({font:DEFAULT_SETTINGS.font});
      unregisterFont(id);setFonts(current=>current.filter(item=>item.id!==id));
    }catch(e){setError((e as Error).message);}
  };
  useEffect(()=>{
    if(!book)return;
    const controller=new AbortController();setBusy(true);
    initialOffset.current=offsetRef.current;
    parseAsync({text:book.text,rule,settings},controller.signal).then(next=>{if(!controller.signal.aborted){setDoc(next);setPage(pageForOffset(next.pages,initialOffset.current));}}).catch(e=>{if(e.name!=='AbortError'){setError(e.message);if(!doc){setBook(null);setCover(false);}}}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[book,rule.mode,rule.pattern,settings.size,settings.lineHeight,settings.indent]);
  const coverDoc=useMemo(()=>{const result=parseDocument({text:COVER_TEXT,rule:{mode:'number',pattern:''},settings});if(result.pages[0]?.blocks[0])result.pages[0].blocks[0].heading=true;return result;},[settings.size,settings.lineHeight,settings.indent]);
  const viewDoc=cover||!doc?coverDoc:doc;
  const isReading=!!book&&!cover&&!!doc;
  const active=Math.max(0,viewDoc.chapters.findLastIndex(c=>c.start<=(isReading?offset:0)));
  const jump=useCallback((target:number)=>api.current?.jump(target),[]);
  const onApi=useCallback((value:ReaderApi)=>{api.current=value;},[]);
  const position=useCallback((value:number,index:number)=>{setPage(index);const current=live.current;if(current.book&&!current.cover&&current.ready){offsetRef.current=value;setOffset(value);}},[]);
  useEffect(()=>{if(!book||cover)return;const timer=setTimeout(flush,300);return()=>clearTimeout(timer);},[offset,book?.id,cover,rule,flush]);
  useEffect(()=>window.reader?.beforeClose(flush),[flush]);
  const showCover=useCallback(()=>{if(live.current.book){flush();setCover(true);setFile(false);setRules(false);setQuery('');setPage(0);}},[flush]);
  const resume=useCallback(()=>{if(live.current.book){initialOffset.current=offsetRef.current;setCover(false);setPage(doc?pageForOffset(doc.pages,offsetRef.current):0);}},[doc]);
  const find=useCallback(()=>{update({navigation:true});setSection('结果');setFocusKey(key=>key+1);},[update]);
  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      const mod=event.ctrlKey||event.metaKey;
      const target=event.target as HTMLElement;
      const editing=['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable;
      if(mod&&event.key.toLowerCase()==='o'){event.preventDefault();open();}
      else if(mod&&event.shiftKey&&event.key.toLowerCase()==='r'){event.preventDefault();resume();}
      else if(event.key==='Escape'){event.preventDefault();if(rules)setRules(false);else if(file)setFile(false);else showCover();}
      else if(mod&&event.key.toLowerCase()==='f'){event.preventDefault();find();}
      else if(mod&&event.key.toLowerCase()==='s'){event.preventDefault();flush();}
      else if(!editing&&!file&&!rules&&!mod&&!event.altKey&&!event.isComposing&&!event.defaultPrevented&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageDown','PageUp'].includes(event.key)){event.preventDefault();api.current?.step(['ArrowRight','ArrowDown','PageDown'].includes(event.key)?1:-1);}
      else if(!editing&&!file&&!rules&&!mod&&!event.altKey&&event.key===' '){event.preventDefault();api.current?.step(event.shiftKey?-1:1);}
    };
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[open,resume,showCover,rules,file,find,flush]);
  useEffect(()=>{if(!settings.blurCover)return;const listener=()=>{if(!opening.current)showCover();};window.addEventListener('blur',listener);return()=>window.removeEventListener('blur',listener);},[settings.blurCover,showCover]);
  useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),8000);return()=>clearTimeout(timer);},[error]);
  const results=useMemo<SearchResult[]>(()=>{
    if(!query.trim()||!isReading)return[];
    const lower=book!.text.toLocaleLowerCase(),needle=query.toLocaleLowerCase(),found:SearchResult[]=[];
    let from=0;while(found.length<500){const at=lower.indexOf(needle,from);if(at<0)break;found.push({start:at,excerpt:book!.text.slice(Math.max(0,at-14),at+needle.length+42).replace(/\n/g,' ')});from=at+Math.max(1,needle.length);}return found;
  },[query,book?.text,isReading]);
  const rulesOpen=()=>{if(isReading)setRules(true);else if(book){resume();setRules(true);setFile(false);}else setError('请先通过「文件 → 打开」选择 TXT 文档。');};
  const recode=(encoding:string)=>{if(book)void action(()=>window.reader!.recent(book.id,encoding));};
  const forget=async(id:string)=>{try{await window.reader?.forget(id);const l=await window.reader?.library();if(l)setRecent(l.recent);}catch(e){setError((e as Error).message);}};
  return <div className={`word-app ${platform==='darwin'?'mac':'windows'}`}>
    <header className="titlebar"><div className="quick-access"><span className="word-icon">W</span><span className="autosave-label">自动保存</span><span className="fake-switch"><span/></span><button title="保存"><Save size={16}/></button><button title="撤销"><Undo2 size={16}/></button><button title="恢复"><Redo2 size={16}/></button><ChevronDown size={11}/></div><div className="document-title">文档1 <ChevronDown size={11}/><span className="title-divider"/> Word</div><div className="title-search"><Search size={15}/><span>搜索 (Alt+Q)</span></div><div className="title-user">J</div></header>
    <nav className="tabbar" aria-label="功能区选项卡"><div className="tab-list">{['文件','开始','插入','绘图','设计','布局','引用','邮件','审阅','视图','帮助'].map(name=><button key={name} className={`ribbon-tab ${tab===name&&name!=='文件'?'active':''} ${name==='文件'?'file-tab':''}`} onClick={name==='文件'?()=>setFile(true):name==='开始'||name==='视图'?()=>setTab(name):undefined}>{name}</button>)}</div><div className="tab-actions"><button><MessageSquare size={14}/>批注</button><button><span>⌑</span>编辑<ChevronDown size={10}/></button><button className="share-button"><Share2 size={13}/>共享<ChevronDown size={10}/></button></div></nav>
    <Ribbon tab={tab} settings={settings} update={update} find={find} showRules={rulesOpen} fonts={fonts} importFont={()=>void importFont()} fontBusy={fontBusy}/>
    <div className="workspace">
      <div className="document-rail"><button className={`navigation-toggle ${settings.navigation&&isReading?'active':''}`} aria-label="导航" title="导航" aria-expanded={settings.navigation&&isReading} aria-controls="document-navigation" disabled={!isReading} onClick={()=>{update({navigation:!settings.navigation});setSection('标题');}}><PanelLeft size={17} strokeWidth={1.5}/><span>导航</span></button></div>
      {settings.navigation&&isReading&&<Navigation doc={viewDoc} active={active} jump={jump} close={()=>update({navigation:false})} rules={rulesOpen} query={query} setQuery={setQuery} results={results} focusKey={focusKey} section={section} setSection={setSection}/>}
      <div className="document-area">
        {settings.ruler&&<div className="ruler-shelf"><div className="tab-stop">⌞</div><div className="horizontal-ruler" style={{width:794*settings.zoom/100}}><div className="ruler-margin left"/><div className="ruler-ticks">{Array.from({length:17},(_,i)=><span key={i}>{i===0?'':i}</span>)}</div><div className="ruler-margin right"/><span className="indent-marker">▽<br/>△</span></div></div>}
        <ReaderView key={`${book?.id??'start'}-${cover?'cover':'reading'}`} doc={viewDoc} settings={cover?{...settings,bold:false,italic:false,underline:false,color:'#242424'}:settings} initialOffset={isReading?initialOffset.current:0} onPosition={position} onApi={onApi} search={isReading?query:''}/>
        {!book&&<div className="welcome-tip"><FileText size={15}/><span>通过 <button onClick={()=>setFile(true)}>文件 → 打开</button> 选择 TXT 文档，或 <button onClick={sample}>试读示例</button></span></div>}
        {busy&&<div className="loading-overlay"><span><LoaderCircle size={20} className="spin"/>正在整理文档…</span></div>}
      </div>
    </div>
    <footer className="statusbar"><div className="status-left"><span>第 {Math.min(page+1,viewDoc.pages.length)} 页，共 {viewDoc.pages.length} 页</span><span>{viewDoc.wordCount.toLocaleString()} 个字</span><span>中文（中国）</span><ShieldCheck size={13}/>{isReading&&<span className="reading-percent">{Math.min(100,Math.floor(offset/Math.max(1,book!.text.length)*100))}%</span>}</div><div className="status-right"><button title="阅读视图"><BookOpen size={15}/></button><button className="status-view-selected" title="打印布局"><FileText size={15}/></button><button title="Web 版式"><span>▦</span></button><button aria-label="缩小" onClick={()=>update({zoom:Math.max(50,settings.zoom-10)})}><Minus size={13}/></button><input aria-label="显示比例" type="range" min="50" max="160" step="10" value={settings.zoom} onChange={e=>update({zoom:Number(e.target.value)})}/><button aria-label="放大" onClick={()=>update({zoom:Math.min(160,settings.zoom+10)})}><Plus size={13}/></button><button className="zoom-value" onClick={()=>update({zoom:100})}>{settings.zoom}%</button></div></footer>
    {file&&<Backstage recent={recent} book={book} settings={settings} update={update} close={()=>setFile(false)} open={open} loadRecent={loadRecent} sample={sample} forget={id=>void forget(id)} recode={recode} showRules={rulesOpen} fonts={fonts} importFont={()=>void importFont()} removeFont={id=>void removeFont(id)} fontBusy={fontBusy}/>}
    {rules&&book&&<RulesDialog text={book.text} current={rule} settings={settings} onClose={()=>setRules(false)} onApply={next=>{flush();initialOffset.current=offsetRef.current;setRule(next);setRules(false);setSection('标题');update({navigation:true});}}/>}
    {error&&<div className="toast" role="alert"><span>{error}</span><button onClick={()=>setError('')} aria-label="关闭提示"><X size={16}/></button></div>}
  </div>;
}
