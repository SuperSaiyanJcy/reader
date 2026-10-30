import type { CustomFont, FontData } from '../types';

const loaded = new Map<string, FontFace>();
export async function registerFont(font: FontData): Promise<CustomFont> {
  if (!loaded.has(font.id)) {
    const face = new FontFace(font.family, font.data);
    try { await face.load(); }
    catch { throw new Error(`无法加载字体“${font.name}”，请确认文件完整并重新导入。`); }
    document.fonts.add(face);
    loaded.set(font.id, face);
  }
  return { id: font.id, name: font.name, family: font.family };
}
export function unregisterFont(id: string) {
  const face = loaded.get(id);
  if (face) document.fonts.delete(face);
  loaded.delete(id);
}
