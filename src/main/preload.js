const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportTikZ: (data) => ipcRenderer.invoke('export-tikz', data),
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  exportPDFFromSVG: (data) => ipcRenderer.invoke('export-pdf-from-svg', data),
  onMenuExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  removeMenuExportPDF: (callback) => ipcRenderer.removeListener('menu-export-pdf', callback)
});
