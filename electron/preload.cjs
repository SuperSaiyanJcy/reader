const { contextBridge, ipcRenderer } = require('electron');
const invoke = async (channel, ...args) => {
  const result = await ipcRenderer.invoke(channel, ...args);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};
contextBridge.exposeInMainWorld('reader', {
  library: () => invoke('reader:library'),
  open: () => invoke('reader:open'),
  recent: (id, encoding) => invoke('reader:recent', id, encoding),
  sample: () => invoke('reader:sample'),
  progress: value => invoke('reader:progress', value),
  forget: id => invoke('reader:forget', id),
  importFont: () => invoke('reader:import-font'),
  font: id => invoke('reader:font', id),
  removeFont: id => invoke('reader:remove-font', id),
  beforeClose: callback => { const listener = () => callback(); ipcRenderer.on('reader:before-close', listener); return () => ipcRenderer.removeListener('reader:before-close', listener); }
});
