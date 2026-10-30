const { app, BrowserWindow, ipcMain, dialog, Menu, protocol, net } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { decodeText } = require('./encoding.cjs');
const { MAX_FONT_BYTES, validateTtf, fontMeta, validFontMeta } = require('./fonts.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'reader', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
let win, statePath, writeTimer, flushing = Promise.resolve();
let state = { recent: [], lastId: null, fonts: [] };
const MAX_BYTES = 50 * 1024 * 1024;
const isSmoke = process.argv.includes('--smoke-test');
if (process.env.READER_TEST_DATA) app.setPath('userData', process.env.READER_TEST_DATA);

function persist() {
  const content = JSON.stringify(state, null, 2);
  flushing = flushing.catch(() => {}).then(async () => {
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(`${statePath}.tmp`, content, 'utf8');
    await fs.rename(`${statePath}.tmp`, statePath);
  }).catch(error => console.error('保存阅读记录失败:', error.message));
  return flushing;
}
function schedulePersist() { clearTimeout(writeTimer); writeTimer = setTimeout(persist, 450); }
const fontPath = id => path.join(app.getPath('userData'), 'fonts', `${id}.ttf`);
async function fontData(meta) {
  return { ...meta, data: Uint8Array.from(await fs.readFile(fontPath(meta.id))) };
}
async function readBook(filePath, encoding = 'auto') {
  if (path.extname(filePath).toLowerCase() !== '.txt') throw new Error('请选择 .txt 格式的文件');
  const info = await fs.stat(filePath);
  if (!info.isFile()) throw new Error('所选项目不是文件');
  if (info.size > MAX_BYTES) throw new Error('文件超过 50 MB，请先拆分后打开');
  if (!info.size) throw new Error('这个 TXT 文件是空的');
  const buffer = await fs.readFile(filePath);
  const decoded = decodeText(buffer, encoding);
  if (!decoded.text.trim()) throw new Error('这个 TXT 文件没有可阅读的内容');
  const id = createHash('sha256').update(path.resolve(filePath)).digest('hex').slice(0, 24);
  const previous = state.recent.find(item => item.id === id);
  const book = { id, path: filePath, name: path.basename(filePath), size: info.size, modified: info.mtimeMs, encoding: decoded.encoding, offset: previous?.offset ?? 0, rule: previous?.rule ?? { mode: 'auto', pattern: '' }, lastOpened: Date.now() };
  state.recent = [book, ...state.recent.filter(item => item.id !== id)].slice(0, 20);
  state.lastId = id;
  await persist();
  return { ...book, text: decoded.text };
}
function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('无效的调用来源');
    try { return { ok: true, value: await fn(...args) }; }
    catch (error) { return { ok: false, error: error.code === 'ENOENT' ? '找不到文件，可能已被移动或删除，请重新打开。' : error.message }; }
  });
}
function setupIPC() {
  handle('reader:library', () => ({ ...state, platform: process.platform }));
  handle('reader:open', async () => {
    const result = await dialog.showOpenDialog(win, { title: '打开', properties: ['openFile'], filters: [{ name: '文本文档', extensions: ['txt'] }] });
    return result.canceled ? null : readBook(result.filePaths[0]);
  });
  handle('reader:recent', (id, encoding) => {
    const item = state.recent.find(item => item.id === id);
    if (!item) throw new Error('阅读记录不存在，请重新打开文件');
    return readBook(item.path, encoding ?? item.encoding ?? 'auto');
  });
  handle('reader:sample', () => readBook(path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'resources'), '示例小说.txt')));
  handle('reader:progress', ({ id, offset, rule }) => {
    const item = state.recent.find(item => item.id === id);
    if (!item || !Number.isSafeInteger(offset) || offset < 0) return;
    item.offset = offset;
    if (rule && ['auto', 'chinese', 'english', 'number', 'custom'].includes(rule.mode) && typeof rule.pattern === 'string' && rule.pattern.length <= 1000) item.rule = { mode: rule.mode, pattern: rule.pattern };
    schedulePersist();
  });
  handle('reader:forget', async id => { state.recent = state.recent.filter(item => item.id !== id); if (state.lastId === id) state.lastId = null; await persist(); });
  handle('reader:import-font', async () => {
    const result = await dialog.showOpenDialog(win, { title: '导入字体', properties: ['openFile'], filters: [{ name: 'TrueType 字体', extensions: ['ttf'] }] });
    if (result.canceled) return null;
    const selected = result.filePaths[0];
    if (path.extname(selected).toLowerCase() !== '.ttf') throw new Error('请选择 .ttf 格式的字体');
    const info = await fs.stat(selected);
    if (!info.isFile() || info.size > MAX_FONT_BYTES) throw new Error('请选择不超过 32 MB 的 TTF 字体文件');
    const buffer = await fs.readFile(selected);
    validateTtf(buffer);
    const meta = fontMeta(buffer, selected);
    const existing = state.fonts.find(item => item.id === meta.id);
    if (!existing && state.fonts.length >= 30) throw new Error('最多保留 30 款自定义字体，请先移除不用的字体');
    await fs.mkdir(path.dirname(fontPath(meta.id)), { recursive: true });
    await fs.writeFile(fontPath(meta.id), buffer);
    if (!existing) state.fonts.push(meta);
    await persist();
    return { ...(existing ?? meta), data: Uint8Array.from(buffer) };
  });
  handle('reader:font', id => {
    const meta = state.fonts.find(item => item.id === id);
    if (!meta) throw new Error('找不到该字体，请重新导入');
    return fontData(meta);
  });
  handle('reader:remove-font', async id => {
    if (!state.fonts.some(item => item.id === id)) return;
    state.fonts = state.fonts.filter(item => item.id !== id);
    await persist();
    await fs.unlink(fontPath(id)).catch(error => { if (error.code !== 'ENOENT') throw error; });
  });
}
async function createWindow() {
  win = new BrowserWindow({ width: 1330, height: 920, minWidth: 960, minHeight: 640, show: false, title: '文档1 - Word', backgroundColor: '#f3f3f3', titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 17 }, ...(process.platform !== 'darwin' ? { titleBarOverlay: { color: '#f3f3f3', symbolColor: '#444444', height: 46 } } : {}), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  win.once('ready-to-show', () => { if (!isSmoke) win.show(); });
  win.on('close', () => { win.webContents.send('reader:before-close'); });
  if (process.env.READER_DEV_URL === 'http://127.0.0.1:5173' && !app.isPackaged) await win.loadURL(process.env.READER_DEV_URL);
  else await win.loadURL('reader://app/index.html');
  if (isSmoke) {
    const result = await win.webContents.executeJavaScript('({ title: document.title, hasRoot: !!document.querySelector(".word-app"), bridge: !!window.reader })');
    console.log('READER_SMOKE', JSON.stringify(result));
    app.quit();
  }
}
app.whenReady().then(async () => {
  statePath = path.join(app.getPath('userData'), 'reader-state.json');
  try { const saved = JSON.parse(await fs.readFile(statePath, 'utf8')); if (Array.isArray(saved.recent)) state = { recent: saved.recent.filter(x => typeof x.id === 'string' && typeof x.path === 'string').slice(0, 20), lastId: saved.lastId, fonts: Array.isArray(saved.fonts) ? saved.fonts.filter(validFontMeta).slice(0, 30) : [] }; } catch {}
  protocol.handle('reader', request => {
    const url = new URL(request.url);
    const root = path.join(__dirname, '..', 'dist');
    const asset = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (url.hostname !== 'app' || !asset.startsWith(`${root}${path.sep}`)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(asset).toString());
  });
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ label: 'Word', submenu: [{ role: 'about', label: '关于 Reader' }, { type: 'separator' }, { role: 'hide', label: '隐藏' }, { role: 'hideOthers', label: '隐藏其他' }, { type: 'separator' }, { role: 'quit', label: '退出' }] }, { label: '编辑', submenu: [{ role: 'copy', label: '复制' }, { role: 'selectAll', label: '全选' }] }, { label: '窗口', submenu: [{ role: 'minimize', label: '最小化' }, { role: 'zoom', label: '缩放' }, { role: 'front', label: '前置全部窗口' }] }]) : null);
  setupIPC(); await createWindow();
});
app.on('window-all-closed', () => { app.quit(); });
let quitting = false;
app.on('before-quit', event => {
  if (quitting || !statePath) return;
  event.preventDefault(); quitting = true; clearTimeout(writeTimer); persist().finally(() => app.quit());
});
