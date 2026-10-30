import { parseDocument } from '../lib/parser';
import type { ParseRequest } from '../types';
self.onmessage = (event: MessageEvent<ParseRequest>) => {
  try { self.postMessage({ ok: true, result: parseDocument(event.data) }); }
  catch (error) { self.postMessage({ ok: false, error: (error as Error).message }); }
};
