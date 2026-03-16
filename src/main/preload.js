const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportTikZ: (data) => ipcRenderer.invoke('export-tikz', data)
});
