const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  exportPDFFromSVG: (data) => ipcRenderer.invoke('export-pdf-from-svg', data),
  onMenuExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  removeMenuExportPDF: (callback) => ipcRenderer.removeListener('menu-export-pdf', callback),
  onMenuImportTikZ: (callback) => ipcRenderer.on('menu-import-tikz', callback),
  removeMenuImportTikZ: (callback) => ipcRenderer.removeListener('menu-import-tikz', callback)
});
