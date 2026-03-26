import { ipcMain } from 'electron';
import { Workbook } from 'exceljs';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs-extra';

/**
 * Excel服务 - 处理Excel文件的读写、分析和转换
 */
class ExcelService {
  /**
   * 打开Excel文件
   */
  async openFile(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);

      return {
        success: true,
        filePath,
        sheets: workbook.worksheets.map(ws => ({
          name: ws.name,
          rowCount: ws.rowCount,
          columnCount: ws.columnCount
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 读取Excel文件内容
   */
  async readFile(filePath: string, sheetName?: string) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheets = sheetName
        ? [workbook.getWorksheet(sheetName)]
        : workbook.worksheets;

      const result: any = {};

      for (const worksheet of worksheets) {
        if (!worksheet) continue;

        const data: any[] = [];
        const headers: string[] = [];

        // 读取表头（第一行）
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNum) => {
          headers.push(cell.value?.toString() || `Column${colNum}`);
        });

        // 读取数据行
        worksheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return; // 跳过表头

          const rowData: any = {};
          row.eachCell((cell, colNum) => {
            const header = headers[colNum - 1];
            rowData[header] = this.getCellValue(cell);
          });

          data.push(rowData);
        });

        result[worksheet.name] = {
          headers,
          data,
          rowCount: worksheet.rowCount,
          columnCount: worksheet.columnCount
        };
      }

      return {
        success: true,
        filePath,
        content: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 保存Excel文件
   */
  async saveFile(filePath: string, data: any) {
    try {
      const workbook = new Workbook();

      // 处理多个工作表
      const sheets = Array.isArray(data) ? [data] : Object.values(data);

      for (const sheetData of sheets) {
        const worksheet = workbook.addWorksheet(
          (sheetData as any).name || 'Sheet1'
        );

        const rows = (sheetData as any).data || sheetData;
        if (rows.length === 0) continue;

        // 写入表头
        const headers = Object.keys(rows[0]);
        worksheet.addRow(headers);

        // 写入数据
        for (const row of rows) {
          worksheet.addRow(headers.map(h => row[h]));
        }

        // 自动调整列宽
        worksheet.columns.forEach(column => {
          column.width = 20;
        });
      }

      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        message: '文件保存成功'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取工作表列表
   */
  async getSheets(filePath: string) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheets = workbook.worksheets.map(ws => ({
        name: ws.name,
        rowCount: ws.rowCount,
        columnCount: ws.columnCount
      }));

      return {
        success: true,
        sheets
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 数据分析 - 识别数据类型、统计等
   */
  async analyzeData(filePath: string, sheetName: string, rules: any) {
    try {
      const result = await this.readFile(filePath, sheetName);
      if (!result.success) throw new Error(result.error);

      const sheetContent = result.content[sheetName];
      if (!sheetContent) throw new Error('工作表不存在');

      const { headers, data } = sheetContent;
      const analysis: any = {};

      // 分析每一列
      for (const header of headers) {
        const values = data.map(row => row[header]);
        analysis[header] = this.analyzeColumn(values);
      }

      return {
        success: true,
        analysis
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 数据转换
   */
  async transformData(data: any[], rules: any) {
    try {
      let transformed = [...data];

      // 应用转换规则
      for (const rule of rules) {
        transformed = this.applyRule(transformed, rule);
      }

      return {
        success: true,
        data: transformed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取单元格格式
   */
  async getCellFormat(filePath: string, sheetName: string, cell: string) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(sheetName);

      if (!worksheet) throw new Error('工作表不存在');

      const cellObj = worksheet.getCell(cell);

      return {
        success: true,
        format: {
          fill: cellObj.fill,
          font: cellObj.font,
          alignment: cellObj.alignment,
          border: cellObj.border,
          numFmt: cellObj.numFmt,
          value: cellObj.value
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
   * 设置单元格格式
   */
  async setCellFormat(filePath: string, sheetName: string, cell: string, format: any) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(sheetName);

      if (!worksheet) throw new Error('工作表不存在');

      const cellObj = worksheet.getCell(cell);

      if (format.fill) cellObj.fill = format.fill;
      if (format.font) cellObj.font = format.font;
      if (format.alignment) cellObj.alignment = format.alignment;
      if (format.border) cellObj.border = format.border;
      if (format.numFmt) cellObj.numFmt = format.numFmt;

      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        message: '格式设置成功'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 辅助方法：获取单元格值（处理不同类型）
   */
  private getCellValue(cell: any) {
    if (cell.value === null || cell.value === undefined) {
      return '';
    }

    // 处理公式
    if (cell.formula) {
      return cell.value;
    }

    // 处理富文本
    if (cell.type === 's' && typeof cell.value === 'object') {
      return cell.value.richText?.map((t: any) => t.text).join('') || '';
    }

    return cell.value;
  }

  /**
   * 辅助方法：分析列数据
   */
  private analyzeColumn(values: any[]) {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

    if (nonNullValues.length === 0) {
      return { type: 'empty', count: 0, nullCount: values.length };
    }

    // 判断数据类型
    let type = 'text';
    if (nonNullValues.every(v => !isNaN(v))) {
      type = 'number';
    } else if (nonNullValues.every(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
      type = 'date';
    }

    return {
      type,
      count: nonNullValues.length,
      nullCount: values.length - nonNullValues.length,
      values: nonNullValues.slice(0, 10), // 前10个值示例
      uniqueCount: new Set(nonNullValues).size
    };
  }

  /**
   * 辅助方法：应用转换规则
   */
  private applyRule(data: any[], rule: any) {
    switch (rule.type) {
      case 'filter':
        return data.filter(row => {
          const value = row[rule.field];
          return this.matchesCondition(value, rule.condition, rule.value);
        });

      case 'map':
        return data.map(row => ({
          ...row,
          [rule.targetField]: this.transformValue(row[rule.sourceField], rule.transform)
        }));

      case 'rename':
        return data.map(row => {
          const newRow = { ...row };
          for (const [old, newName] of Object.entries(rule.mappings)) {
            if (newRow[old]) {
              newRow[newName as string] = newRow[old];
              delete newRow[old];
            }
          }
          return newRow;
        });

      default:
        return data;
    }
  }

  /**
   * 辅助方法：匹配条件
   */
  private matchesCondition(value: any, condition: string, conditionValue: any): boolean {
    switch (condition) {
      case 'equals':
        return value === conditionValue;
      case 'contains':
        return String(value).includes(String(conditionValue));
      case 'greaterThan':
        return Number(value) > Number(conditionValue);
      case 'lessThan':
        return Number(value) < Number(conditionValue);
      default:
        return true;
    }
  }

  /**
   * 辅助方法：转换值
   */
  private transformValue(value: any, transform: any): any {
    switch (transform.type) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'replace':
        return String(value).replace(new RegExp(transform.from, 'g'), transform.to);
      default:
        return value;
    }
  }
}

/**
 * 注册Excel IPC处理器
 */
export function registerExcelHandlers(ipcMain: any) {
  const excelService = new ExcelService();

  ipcMain.handle('excel:open-file', async (event, filePath) => {
    return excelService.openFile(filePath);
  });

  ipcMain.handle('excel:read-file', async (event, filePath) => {
    return excelService.readFile(filePath);
  });

  ipcMain.handle('excel:save-file', async (event, { filePath, data }) => {
    return excelService.saveFile(filePath, data);
  });

  ipcMain.handle('excel:get-sheets', async (event, filePath) => {
    return excelService.getSheets(filePath);
  });

  ipcMain.handle('excel:analyze-data', async (event, { filePath, sheetName, rules }) => {
    return excelService.analyzeData(filePath, sheetName, rules);
  });

  ipcMain.handle('excel:transform-data', async (event, { data, rules }) => {
    return excelService.transformData(data, rules);
  });

  ipcMain.handle('excel:get-cell-format', async (event, { filePath, sheetName, cell }) => {
    return excelService.getCellFormat(filePath, sheetName, cell);
  });

  ipcMain.handle('excel:set-cell-format', async (event, { filePath, sheetName, cell, format }) => {
    return excelService.setCellFormat(filePath, sheetName, cell, format);
  });
}
