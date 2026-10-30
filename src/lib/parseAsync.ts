import type { ParsedDocument, ParseRequest } from '../types';
export function parseAsync(request: ParseRequest, signal?: AbortSignal): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); worker.terminate(); signal?.removeEventListener('abort', abort); };
    const abort = () => { finish(); reject(new DOMException('已取消', 'AbortError')); };
    const timer = setTimeout(() => { finish(); reject(new Error(request.rule.mode === 'custom' ? '正则匹配超时，已停止。请简化表达式，避免嵌套量词。' : '文档处理超时，请拆分文件后重试。')); }, request.rule.mode === 'custom' ? 2500 : 15000);
    worker.onmessage = event => { finish(); if (event.data.ok) resolve(event.data.result); else reject(new Error(event.data.error)); };
    worker.onerror = event => { finish(); reject(new Error(event.message || '文档处理失败')); };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort);
    worker.postMessage(request);
  });
}
