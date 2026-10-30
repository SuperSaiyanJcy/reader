import { useEffect, useState } from 'react';
import { Check, ChevronRight, LoaderCircle, X } from 'lucide-react';
import type { ParsedDocument, Settings, TocRule, RuleMode } from '../types';
import { parseAsync } from '../lib/parseAsync';
const OPTIONS: {mode:RuleMode;name:string;example:string}[]=[{mode:'auto',name:'自动识别',example:'中文章节、英文 Chapter；无明确章节时尝试数字标题'},{mode:'chinese',name:'中文章节',example:'第一章 / 第12回 / 卷三 / 序章 / 番外'},{mode:'english',name:'英文章节',example:'Chapter 1 / PART IV / Section 2'},{mode:'number',name:'数字标题',example:'1、起点 / 12. 远方 / 三、归途'},{mode:'custom',name:'自定义正则表达式',example:'对每一行独立匹配，支持 JavaScript 正则语法'}];
export default function RulesDialog({text,current,settings,onClose,onApply}:{text:string;current:TocRule;settings:Settings;onClose:()=>void;onApply:(rule:TocRule)=>void}) {
  const [rule,setRule]=useState<TocRule>(current);
  const [preview,setPreview]=useState<ParsedDocument|null>(null);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    setPreview(null);setError('');setBusy(true);
    const timer=setTimeout(()=>parseAsync({text,rule,settings,preview:true},controller.signal).then(setPreview).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);}),250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[rule,text]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="rules-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title"><div className="dialog-title"><h2 id="rules-title">目录识别规则</h2><button onClick={onClose} aria-label="关闭规则设置"><X size={18}/></button></div>
    <div className="dialog-body"><p className="dialog-description">从 TXT 的标题行生成导航目录。更改规则后可先检查识别结果。</p>
      <label className="field-label">识别方式<select aria-label="识别方式" value={rule.mode} onChange={e=>setRule({...rule,mode:e.target.value as RuleMode})}>{OPTIONS.map(o=><option key={o.mode} value={o.mode}>{o.name}</option>)}</select></label>
      <p className="rule-example">{OPTIONS.find(o=>o.mode===rule.mode)?.example}</p>
      {rule.mode==='custom'&&<><label className="field-label">正则表达式<textarea aria-label="正则表达式" spellCheck={false} placeholder={'^第[零一二三四五六七八九十百千万0-9]+章.*$'} value={rule.pattern} maxLength={1000} onChange={e=>setRule({...rule,pattern:e.target.value})}/></label><p className="regex-hint">不需要填写两侧的 /。使用 (?&lt;title&gt;…) 或第一个捕获组可指定目录标题。每行最多匹配 500 字，超时自动停止。</p><div className="regex-presets"><span>示例：</span><button onClick={()=>setRule({...rule,pattern:'^第[零一二三四五六七八九十百千万0-9]+[章回节].*$'})}>第几章</button><button onClick={()=>setRule({...rule,pattern:'^【(?<title>.+)】$'})}>【标题】</button><button onClick={()=>setRule({...rule,pattern:'(?i)^chapter\\s+[0-9]+.*$'})}>Chapter</button></div></>}
      <div className="preview-heading"><span>目录预览</span>{busy?<span><LoaderCircle size={13} className="spin"/>正在匹配…</span>:preview&&<span className={preview.matched?'match-success':''}>{preview.matched>0&&<Check size={13}/>}识别到 {preview.matched} 个标题</span>}</div>
      <div className="toc-preview">{error?<p className="error-message" role="alert">{error}</p>:preview?.matched?preview.chapters.filter(c=>!c.synthetic).slice(0,40).map((c,i)=><div key={i}><ChevronRight size={12}/>{c.title}</div>):!busy&&<p className="empty-preview">没有匹配到标题。{rule.mode==='custom'?'请调整表达式。':'应用后会按文本长度生成分节目录。'}</p>}</div>
    </div><div className="dialog-footer"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={busy||!!error||!preview||(rule.mode==='custom'&&!preview.matched)} onClick={()=>onApply(rule)}>应用</button></div>
  </section></div>;
}
