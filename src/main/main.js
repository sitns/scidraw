const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

const menuLabels = {
  file: '文件',
  new: '新建',
  open: '打开...',
  save: '保存',
  saveAs: '另存为...',
  exportTikZ: '导出 TikZ...',
  exportPDF: '导出 PDF...',
  exit: '退出',
  edit: '编辑',
  undo: '撤销',
  redo: '重做',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  delete: '删除',
  selectAll: '全选',
  view: '视图',
  reload: '重新加载',
  toggleDevTools: '开发者工具',
  zoomIn: '放大',
  zoomOut: '缩小',
  resetZoom: '重置缩放',
  help: '帮助',
  about: '关于 SciDraw'
};

function createMenu() {
  const template = [
    {
      label: menuLabels.file,
      submenu: [
        { label: menuLabels.new, accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-new') },
        { label: menuLabels.open, accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu-open') },
        { type: 'separator' },
        { label: menuLabels.save, accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu-save') },
        { label: menuLabels.saveAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow?.webContents.send('menu-save-as') },
        { type: 'separator' },
        { label: menuLabels.exportTikZ, accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu-export-tikz') },
        { label: menuLabels.exportPDF, accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.send('menu-export-pdf') },
        { type: 'separator' },
        { label: menuLabels.exit, role: 'quit' }
      ]
    },
    {
      label: menuLabels.edit,
      submenu: [
        { label: menuLabels.undo, accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: menuLabels.redo, accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: menuLabels.cut, accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: menuLabels.copy, accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: menuLabels.paste, accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: menuLabels.delete, role: 'delete' },
        { type: 'separator' },
        { label: menuLabels.selectAll, accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: menuLabels.view,
      submenu: [
        { label: menuLabels.reload, accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: menuLabels.toggleDevTools, accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: menuLabels.zoomIn, accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: menuLabels.zoomOut, accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: menuLabels.resetZoom, accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    },
    {
      label: menuLabels.help,
      submenu: [
        { label: menuLabels.about, click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: menuLabels.about,
            message: 'SciDraw - 科研绘图编辑器',
            detail: '版本 1.0.0\n\n使用代码和可视化编辑创建专业科研图表'
          });
        }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

log.info('Application starting...');

let mainWindow;

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
});

function createWindow() {
  log.info('Creating main window...');
  createMenu();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'SciDraw - Scientific Diagram Editor'
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('Main window created successfully');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('save-file', async (event, { content, defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    log.info('File saved:', result.filePath);
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Diagram Files', extensions: ['yaml', 'yml', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    log.info('File opened:', result.filePaths[0]);
    return { success: true, content, filePath: result.filePaths[0] };
  }
  return { success: false };
});

ipcMain.handle('export-tikz', async (event, { content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'diagram.tex',
    filters: [{ name: 'LaTeX', extensions: ['tex'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    log.info('TikZ exported:', result.filePath);
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('export-pdf', async (event, { svgContent, width, height }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'diagram.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      const pdfDoc = await mainWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: {
          width: width * 1000,
          height: height * 1000
        },
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      });
      
      fs.writeFileSync(result.filePath, pdfDoc);
      log.info('PDF exported:', result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      log.error('PDF export failed:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('export-pdf-from-svg', async (event, { svgString, width, height }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'diagram.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      const pdfDoc = await mainWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: {
          width: Math.ceil(width / 72 * 25400),
          height: Math.ceil(height / 72 * 25400)
        },
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      });
      
      fs.writeFileSync(result.filePath, pdfDoc);
      log.info('PDF exported:', result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      log.error('PDF export failed:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

log.info('Main process initialized');
