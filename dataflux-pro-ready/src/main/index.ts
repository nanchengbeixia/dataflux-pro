import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { registerExcelHandlers } from './ipc-handlers/excel.js';
import { registerFileHandlers } from './ipc-handlers/files.js';
import { registerSearchHandlers } from './ipc-handlers/search.js';
import { registerSystemHandlers } from './ipc-handlers/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * 创建应用窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../../public/icons/app.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 启用沙盒模式（安全）
      sandbox: true
    }
  });

  // 开发环境使用本地服务器，生产环境加载打包文件
  const startUrl = isDev 
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  // 开发环境打开DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用启动
 */
app.on('ready', () => {
  // 环境检测
  performEnvironmentCheck();
  
  // 创建窗口
  createWindow();

  // 注册所有IPC处理器
  registerExcelHandlers(ipcMain);
  registerFileHandlers(ipcMain);
  registerSearchHandlers(ipcMain);
  registerSystemHandlers(ipcMain);

  // 创建菜单
  createApplicationMenu();
});

/**
 * 所有窗口关闭时退出应用
 */
app.on('window-all-closed', () => {
  // macOS特殊处理：仅在用户显式关闭应用时才退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * macOS重新启用应用时
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * 环境检测函数
 */
function performEnvironmentCheck() {
  // TODO: 调用环境检测脚本
  // - 检查 Node.js 版本
  // - 检查 Office/WPS 是否安装
  // - 检查 .NET Framework
  // - 检查必要的依赖库
}

/**
 * 创建应用菜单
 */
function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'Excel文件', extensions: ['xlsx', 'xls'] },
                { name: 'WPS文件', extensions: ['et', 'csv'] },
                { name: '所有文件', extensions: ['*'] }
              ]
            });
            mainWindow?.webContents.send('files-opened', result.filePaths);
          }
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            });
            mainWindow?.webContents.send('folder-opened', result.filePaths);
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '刷新', accelerator: 'F5', role: 'reload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 DataFlux Pro',
              message: 'DataFlux Pro v1.0.0',
              detail: '智能文件表格处理系统\n©2024 All Rights Reserved'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 处理Squirrel Windows安装程序事件
 */
if (require('electron-squirrel-startup')) {
  app.quit();
}

export { mainWindow };
