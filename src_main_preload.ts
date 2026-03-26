import { contextBridge, ipcRenderer } from 'electron';

/**
 * 安全的IPC API暴露给渲染进程
 * 所有通信必须通过这个桥接层，防止代码注入
 */
const electronAPI = {
  // ============ Excel表格操作 ============
  excel: {
    // 打开Excel文件
    openFile: (filePath: string) =>
      ipcRenderer.invoke('excel:open-file', filePath),

    // 读取Excel文件内容
    readFile: (filePath: string) =>
      ipcRenderer.invoke('excel:read-file', filePath),

    // 保存Excel文件
    saveFile: (filePath: string, data: any) =>
      ipcRenderer.invoke('excel:save-file', { filePath, data }),

    // 获取工作表列表
    getSheets: (filePath: string) =>
      ipcRenderer.invoke('excel:get-sheets', filePath),

    // 执行数据分析
    analyzeData: (filePath: string, sheetName: string, rules: any) =>
      ipcRenderer.invoke('excel:analyze-data', { filePath, sheetName, rules }),

    // 执行数据转换
    transformData: (data: any[], rules: any) =>
      ipcRenderer.invoke('excel:transform-data', { data, rules }),

    // 获取单元格格式
    getCellFormat: (filePath: string, sheetName: string, cell: string) =>
      ipcRenderer.invoke('excel:get-cell-format', { filePath, sheetName, cell }),

    // 设置单元格格式
    setCellFormat: (filePath: string, sheetName: string, cell: string, format: any) =>
      ipcRenderer.invoke('excel:set-cell-format', { filePath, sheetName, cell, format })
  },

  // ============ 文件操作 ============
  files: {
    // 列出目录文件
    listFiles: (dirPath: string, filter?: string) =>
      ipcRenderer.invoke('files:list', { dirPath, filter }),

    // 批量重命名文件
    renameFiles: (operations: Array<{ oldPath: string; newPath: string }>) =>
      ipcRenderer.invoke('files:rename-batch', operations),

    // 移动文件到指定位置
    moveFiles: (operations: Array<{ sourcePath: string; destPath: string }>) =>
      ipcRenderer.invoke('files:move-batch', operations),

    // 复制文件
    copyFiles: (operations: Array<{ sourcePath: string; destPath: string }>) =>
      ipcRenderer.invoke('files:copy-batch', operations),

    // 删除文件（确认后）
    deleteFiles: (filePaths: string[]) =>
      ipcRenderer.invoke('files:delete-batch', filePaths),

    // 创建文件夹
    createFolder: (dirPath: string) =>
      ipcRenderer.invoke('files:create-folder', dirPath),

    // 获取文件详细信息
    getFileInfo: (filePath: string) =>
      ipcRenderer.invoke('files:get-info', filePath),

    // 批量获取文件信息
    getFilesInfo: (filePaths: string[]) =>
      ipcRenderer.invoke('files:get-batch-info', filePaths),

    // 按规则分类文件
    classifyFiles: (dirPath: string, rules: any) =>
      ipcRenderer.invoke('files:classify', { dirPath, rules })
  },

  // ============ 数据搜索与关联 ============
  search: {
    // 在表格中搜索
    searchInSheet: (filePath: string, sheetName: string, query: string) =>
      ipcRenderer.invoke('search:in-sheet', { filePath, sheetName, query }),

    // 模糊匹配搜索
    fuzzySearch: (data: any[], field: string, query: string, threshold?: number) =>
      ipcRenderer.invoke('search:fuzzy', { data, field, query, threshold }),

    // 跨表关联查询
    crossTableJoin: (config: {
      sourceTable: any;
      targetTable: any;
      sourceKey: string;
      targetKey: string;
      matchFields?: string[];
      threshold?: number;
    }) =>
      ipcRenderer.invoke('search:cross-join', config),

    // 数据填充（从表B复制到表A）
    fillData: (config: {
      sourceData: any[];
      targetData: any[];
      mappings: Array<{ sourceField: string; targetField: string }>;
      joinKey: string;
    }) =>
      ipcRenderer.invoke('search:fill-data', config),

    // 创建数据索引（加速查询）
    createIndex: (data: any[], indexFields: string[]) =>
      ipcRenderer.invoke('search:create-index', { data, indexFields }),

    // 批量查询
    batchQuery: (indexes: any[], queries: Array<{ field: string; value: any }>) =>
      ipcRenderer.invoke('search:batch-query', { indexes, queries })
  },

  // ============ 系统操作 ============
  system: {
    // 检查环境
    checkEnvironment: () =>
      ipcRenderer.invoke('system:check-environment'),

    // 检查Office/WPS安装
    checkOfficeInstalled: () =>
      ipcRenderer.invoke('system:check-office-installed'),

    // 获取系统信息
    getSystemInfo: () =>
      ipcRenderer.invoke('system:get-system-info'),

    // 打开文件选择对话框
    showOpenDialog: (options: any) =>
      ipcRenderer.invoke('system:show-open-dialog', options),

    // 打开文件夹选择对话框
    showFolderDialog: () =>
      ipcRenderer.invoke('system:show-folder-dialog'),

    // 保存文件对话框
    showSaveDialog: (options: any) =>
      ipcRenderer.invoke('system:show-save-dialog', options),

    // 显示通知
    showNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') =>
      ipcRenderer.invoke('system:show-notification', { title, message, type }),

    // 打开文件/文件夹（使用系统默认应用）
    openExplorer: (path: string) =>
      ipcRenderer.invoke('system:open-explorer', path),

    // 执行日志记录
    log: (level: 'info' | 'warn' | 'error', message: string, data?: any) =>
      ipcRenderer.invoke('system:log', { level, message, data })
  },

  // ============ 事件监听 ============
  // 监听来自主进程的事件
  on: (channel: string, listener: (arg: any) => void) => {
    // 安全检查：只允许特定的事件
    const validChannels = [
      'files-opened',
      'folder-opened',
      'operation-progress',
      'operation-complete',
      'error-occurred',
      'file-processing-update'
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, arg) => listener(arg));
    }
  },

  // 移除事件监听
  off: (channel: string, listener: (arg: any) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },

  // 一次性监听
  once: (channel: string, listener: (arg: any) => void) => {
    ipcRenderer.once(channel, (event, arg) => listener(arg));
  }
};

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript类型定义
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
