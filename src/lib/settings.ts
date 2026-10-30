import type { Settings } from '../types';
export const DEFAULT_SETTINGS: Settings = { font: '宋体', size: 12, bold: false, italic: false, underline: false, color: '#242424', align: 'justify', lineHeight: 1.8, indent: true, zoom: 100, navigation: false, ruler: true, blurCover: false };
export const FONT_FAMILIES: Record<string, string> = {
  '宋体': '"Songti SC", SimSun, "Noto Serif CJK SC", serif',
  '微软雅黑': '"Microsoft YaHei", "PingFang SC", sans-serif',
  '苹方': '"PingFang SC", "Microsoft YaHei", sans-serif',
  '仿宋': 'FangSong, STFangsong, "Songti SC", serif',
  '楷体': 'KaiTi, "Kaiti SC", STKaiti, serif',
  '等线': 'DengXian, "PingFang SC", sans-serif',
  'Arial': 'Arial, sans-serif',
  'Times New Roman': '"Times New Roman", serif'
};
export const isCustomFont = (font: unknown): font is string => typeof font === 'string' && /^ReaderFont_[a-f0-9]{24}$/.test(font);
export function fontFamilyFor(font: string): string {
  return FONT_FAMILIES[font] ?? (isCustomFont(font) ? `"${font}", ${FONT_FAMILIES['宋体']}` : FONT_FAMILIES['宋体']);
}
export function loadSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem('reader.settings') || '{}');
    return { ...DEFAULT_SETTINGS, font: Object.hasOwn(FONT_FAMILIES, s.font) || isCustomFont(s.font) ? s.font : DEFAULT_SETTINGS.font, size: [8,9,10,10.5,11,12,14,16,18,20,22,24,26,28,32,36].includes(s.size) ? s.size : 12, bold: !!s.bold, italic: !!s.italic, underline: !!s.underline, color: /^#[a-fA-F0-9]{6}$/.test(s.color) ? s.color : DEFAULT_SETTINGS.color, align: ['left','center','right','justify'].includes(s.align) ? s.align : 'justify', lineHeight: [1.2,1.5,1.8,2,2.5].includes(s.lineHeight) ? s.lineHeight : 1.8, indent: s.indent !== false, zoom: Number.isFinite(s.zoom) ? Math.max(50, Math.min(160, s.zoom)) : 100, navigation: !!s.navigation, ruler: s.ruler !== false, blurCover: !!s.blurCover };
  } catch { return DEFAULT_SETTINGS; }
}
