import { ipcMain, dialog } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import minimatch from 'minimatch';

/**
 * 文件服务 - 批量文件操作、重命名、分类等
 */
class FileService {
  /**
   * 列出目录文件
   */
  async listFiles(dirPath: string, filter?: string) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`目录不存在: ${dirPath}`);
      }

      const files = await fs.readdir(dirPath, { withFileTypes: true });

      const result = files
        .map(file => ({
          name: file.name,
          fullPath: path.join(dirPath, file.name),
          isDirectory: file.isDirectory(),
          size: file.isFile() ? fs.statSync(path.join(dirPath, file.name)).size : null,
          modified: fs.statSync(path.join(dirPath, file.name)).mtime
        }))
        .filter(file => !filter || minimatch(file.name, filter));

      return {
        success: true,
        files: result,
        count: result.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量重命名文件
   */
  async renameFiles(operations: Array<{ oldPath: string; newPath: string }>) {
    try {
      const results: any[] = [];
      const errors: any[] = [];

      for (const { oldPath, newPath } of operations) {
        try {
          if (!fs.existsSync(oldPath)) {
            throw new Error(`源文件不存在: ${oldPath}`);
          }

          // 检查目标路径是否已存在
          if (fs.existsSync(newPath)) {
            errors.push({
              oldPath,
              newPath,
              error: '目标文件已存在'
            });
            continue;
          }

          await fs.rename(oldPath, newPath);

          results.push({
            oldPath,
            newPath,
            status: 'success'
          });
        } catch (error: any) {
          errors.push({
            oldPath,
            newPath,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors,
        summary: {
          total: operations.length,
          successful: results.length,
          failed: errors.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量移动文件
   */
  async moveFiles(operations: Array<{ sourcePath: string; destPath: string }>) {
    try {
      const results: any[] = [];
      const errors: any[] = [];

      for (const { sourcePath, destPath } of operations) {
        try {
          if (!fs.existsSync(sourcePath)) {
            throw new Error(`源文件不存在: ${sourcePath}`);
          }

          // 创建目标目录
          const destDir = path.dirname(destPath);
          await fs.ensureDir(destDir);

          // 检查目标文件是否存在
          if (fs.existsSync(destPath)) {
            throw new Error('目标文件已存在');
          }

          await fs.move(sourcePath, destPath);

          results.push({
            sourcePath,
            destPath,
            status: 'success'
          });
        } catch (error: any) {
          errors.push({
            sourcePath,
            destPath,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors,
        summary: {
          total: operations.length,
          successful: results.length,
          failed: errors.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量复制文件
   */
  async copyFiles(operations: Array<{ sourcePath: string; destPath: string }>) {
    try {
      const results: any[] = [];
      const errors: any[] = [];

      for (const { sourcePath, destPath } of operations) {
        try {
          if (!fs.existsSync(sourcePath)) {
            throw new Error(`源文件不存在: ${sourcePath}`);
          }

          const destDir = path.dirname(destPath);
          await fs.ensureDir(destDir);

          await fs.copy(sourcePath, destPath);

          results.push({
            sourcePath,
            destPath,
            status: 'success'
          });
        } catch (error: any) {
          errors.push({
            sourcePath,
            destPath,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(filePaths: string[]) {
    try {
      const results: any[] = [];
      const errors: any[] = [];

      for (const filePath of filePaths) {
        try {
          if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
          }

          // 移到回收站而不是永久删除
          // 在实际应用中应该实现"回收站"功能
          await fs.remove(filePath);

          results.push({
            filePath,
            status: 'success'
          });
        } catch (error: any) {
          errors.push({
            filePath,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(dirPath: string) {
    try {
      if (fs.existsSync(dirPath)) {
        throw new Error('文件夹已存在');
      }

      await fs.ensureDir(dirPath);

      return {
        success: true,
        dirPath,
        message: '文件夹创建成功'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取文件详细信息
   */
  async getFileInfo(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }

      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath);
      const name = path.basename(filePath);
      const dir = path.dirname(filePath);

      return {
        success: true,
        info: {
          name,
          path: filePath,
          directory: dir,
          extension: ext,
          size: stat.size,
          sizeFormatted: this.formatFileSize(stat.size),
          created: stat.birthtime,
          modified: stat.mtime,
          accessed: stat.atime,
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量获取文件信息
   */
  async getFilesInfo(filePaths: string[]) {
    try {
      const results: any[] = [];

      for (const filePath of filePaths) {
        const result = await this.getFileInfo(filePath);
        if (result.success) {
          results.push(result.info);
        }
      }

      return {
        success: true,
        files: results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 按规则分类和移动文件
   */
  async classifyFiles(dirPath: string, rules: any) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`目录不存在: ${dirPath}`);
      }

      const files = await fs.readdir(dirPath);
      const operations: Array<{ sourcePath: string; destPath: string }> = [];

      for (const file of files) {
        const sourcePath = path.join(dirPath, file);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) continue; // 跳过文件夹

        let targetFolder = 'other'; // 默认分类

        // 按扩展名分类
        if (rules.byExtension) {
          const ext = path.extname(file).toLowerCase().substring(1);
          for (const [category, exts] of Object.entries(rules.byExtension)) {
            if ((exts as string[]).includes(ext)) {
              targetFolder = category;
              break;
            }
          }
        }

        // 按日期分类
        if (rules.byDate) {
          const modified = fs.statSync(sourcePath).mtime;
          const year = modified.getFullYear();
          const month = String(modified.getMonth() + 1).padStart(2, '0');

          targetFolder = rules.byDate === 'year'
            ? String(year)
            : `${year}-${month}`;
        }

        // 按大小分类
        if (rules.bySize) {
          const size = stat.size;
          for (const [category, sizeRange] of Object.entries(rules.bySize)) {
            const [min, max] = sizeRange as [number, number];
            if (size >= min && size <= max) {
              targetFolder = category;
              break;
            }
          }
        }

        const targetDir = path.join(dirPath, targetFolder);
        const destPath = path.join(targetDir, file);

        operations.push({ sourcePath, destPath });
      }

      // 执行移动操作
      return this.moveFiles(operations);
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 辅助方法：格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * 注册文件IPC处理器
 */
export function registerFileHandlers(ipcMain: any) {
  const fileService = new FileService();

  ipcMain.handle('files:list', async (event, { dirPath, filter }) => {
    return fileService.listFiles(dirPath, filter);
  });

  ipcMain.handle('files:rename-batch', async (event, operations) => {
    return fileService.renameFiles(operations);
  });

  ipcMain.handle('files:move-batch', async (event, operations) => {
    return fileService.moveFiles(operations);
  });

  ipcMain.handle('files:copy-batch', async (event, operations) => {
    return fileService.copyFiles(operations);
  });

  ipcMain.handle('files:delete-batch', async (event, filePaths) => {
    return fileService.deleteFiles(filePaths);
  });

  ipcMain.handle('files:create-folder', async (event, dirPath) => {
    return fileService.createFolder(dirPath);
  });

  ipcMain.handle('files:get-info', async (event, filePath) => {
    return fileService.getFileInfo(filePath);
  });

  ipcMain.handle('files:get-batch-info', async (event, filePaths) => {
    return fileService.getFilesInfo(filePaths);
  });

  ipcMain.handle('files:classify', async (event, { dirPath, rules }) => {
    return fileService.classifyFiles(dirPath, rules);
  });
}
