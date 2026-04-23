const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  exportPDFFromSVG: (data) => ipcRenderer.invoke('export-pdf-from-svg', data),
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  removeMenuNew: (callback) => ipcRenderer.removeListener('menu-new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
  removeMenuOpen: (callback) => ipcRenderer.removeListener('menu-open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  removeMenuSave: (callback) => ipcRenderer.removeListener('menu-save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
  removeMenuSaveAs: (callback) => ipcRenderer.removeListener('menu-save-as', callback),
  onMenuExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  removeMenuExportPDF: (callback) => ipcRenderer.removeListener('menu-export-pdf', callback),
  onMenuImportTikZ: (callback) => ipcRenderer.on('menu-import-tikz', callback),
  removeMenuImportTikZ: (callback) => ipcRenderer.removeListener('menu-import-tikz', callback),
  onMenuImportDrawio: (callback) => ipcRenderer.on('menu-import-drawio', callback),
  removeMenuImportDrawio: (callback) => ipcRenderer.removeListener('menu-import-drawio', callback)
});
