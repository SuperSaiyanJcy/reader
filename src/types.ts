export type RuleMode = 'auto' | 'chinese' | 'english' | 'number' | 'custom';
export interface TocRule { mode: RuleMode; pattern: string }
export interface BookMeta { id: string; path: string; name: string; size: number; modified: number; encoding: string; offset: number; rule: TocRule; lastOpened: number }
export interface Book extends BookMeta { text: string }
export interface CustomFont { id: string; name: string; family: string }
export interface FontData extends CustomFont { data: Uint8Array<ArrayBuffer> }
export interface Library { recent: BookMeta[]; lastId: string | null; platform: string; fonts: CustomFont[] }
export interface Chapter { title: string; start: number; end: number; synthetic?: boolean }
export interface Block { text: string; start: number; heading: boolean; continued?: boolean }
export interface Page { start: number; end: number; blocks: Block[] }
export interface ParsedDocument { chapters: Chapter[]; pages: Page[]; matched: number; fallback: boolean; wordCount: number }
export interface Settings { font: string; size: number; bold: boolean; italic: boolean; underline: boolean; color: string; align: 'left' | 'center' | 'right' | 'justify'; lineHeight: number; indent: boolean; zoom: number; navigation: boolean; ruler: boolean; blurCover: boolean }
export interface ParseRequest { text: string; rule: TocRule; settings: Pick<Settings, 'size' | 'lineHeight' | 'indent'>; preview?: boolean }
declare global {
  interface Window {
    reader?: {
      library(): Promise<Library>;
      open(): Promise<Book | null>;
      recent(id: string, encoding?: string): Promise<Book>;
      sample(): Promise<Book>;
      progress(value: { id: string; offset: number; rule: TocRule }): Promise<void>;
      forget(id: string): Promise<void>;
      importFont(): Promise<FontData | null>;
      font(id: string): Promise<FontData>;
      removeFont(id: string): Promise<void>;
      beforeClose(callback: () => void): () => void;
    }
  }
}
