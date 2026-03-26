import { ipcMain } from 'electron';
import LevenshteinDistance from 'levenshtein-distance';
import Fuse from 'fuse.js';

/**
 * 搜索与数据关联服务
 * 实现：模糊匹配、跨表关联、数据填充等核心功能
 */
class SearchService {
  /**
   * 模糊搜索 - 使用Fuse.js库
   */
  fuzzySearch(data: any[], field: string, query: string, threshold: number = 0.6) {
    try {
      const fuse = new Fuse(data, {
        keys: [field],
        threshold: 1 - threshold, // Fuse使用反向阈值
        minMatchCharLength: 1
      });

      const results = fuse.search(query);

      return {
        success: true,
        results: results.map(r => ({
          item: r.item,
          score: r.score,
          matches: r.matches
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
   * 计算字符串相似度 - 使用Levenshtein距离
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = String(str1).toLowerCase().trim();
    const s2 = String(str2).toLowerCase().trim();

    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;

    const maxLen = Math.max(s1.length, s2.length);
    const distance = LevenshteinDistance(s1, s2);

    return 1 - distance / maxLen;
  }

  /**
   * 跨表关联查询 - 核心算法
   * 支持模糊匹配和多字段关联
   */
  crossTableJoin(config: {
    sourceTable: any[];
    targetTable: any[];
    sourceKey: string;
    targetKey: string;
    matchFields?: string[];
    threshold?: number;
  }) {
    try {
      const {
        sourceTable,
        targetTable,
        sourceKey,
        targetKey,
        matchFields = [],
        threshold = 0.8
      } = config;

      const results: any[] = [];
      const matchedTargets = new Set();

      // 为目标表创建索引（加速查询）
      const targetIndex = this.createStringIndex(
        targetTable,
        targetKey
      );

      // 对于源表的每一行
      for (const sourceRow of sourceTable) {
        const sourceValue = String(sourceRow[sourceKey]).toLowerCase().trim();

        let bestMatch: any = null;
        let bestScore = 0;

        // 在目标表中查找最佳匹配
        for (const targetRow of targetTable) {
          const targetValue = String(targetRow[targetKey]).toLowerCase().trim();

          // 计算相似度
          let score = this.calculateSimilarity(sourceValue, targetValue);

          // 如果有额外匹配字段，加权计算
          if (matchFields.length > 0 && score > 0.5) {
            const fieldScores = matchFields.map(field => {
              const srcVal = String(sourceRow[field] || '').toLowerCase().trim();
              const tgtVal = String(targetRow[field] || '').toLowerCase().trim();
              return this.calculateSimilarity(srcVal, tgtVal);
            });

            const avgFieldScore = fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length;
            score = (score + avgFieldScore) / 2;
          }

          // 更新最佳匹配
          if (score > bestScore) {
            bestScore = score;
            bestMatch = targetRow;
          }
        }

        // 如果匹配度超过阈值，执行关联
        if (bestScore >= threshold && bestMatch) {
          matchedTargets.add(targetTable.indexOf(bestMatch));

          results.push({
            sourceRow,
            targetRow: bestMatch,
            matchScore: bestScore,
            matchKey: {
              source: sourceValue,
              target: String(bestMatch[targetKey]).toLowerCase().trim()
            }
          });
        } else {
          results.push({
            sourceRow,
            targetRow: null,
            matchScore: bestScore,
            status: 'unmatched'
          });
        }
      }

      return {
        success: true,
        results,
        summary: {
          totalSource: sourceTable.length,
          matched: results.filter(r => r.targetRow).length,
          unmatched: results.filter(r => !r.targetRow).length,
          matchRate: (results.filter(r => r.targetRow).length / sourceTable.length * 100).toFixed(2) + '%'
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
   * 数据填充 - 从源表复制到目标表
   * 保持格式不变，处理编码问题
   */
  fillData(config: {
    sourceData: any[];
    targetData: any[];
    mappings: Array<{ sourceField: string; targetField: string }>;
    joinKey: string;
  }) {
    try {
      const {
        sourceData,
        targetData,
        mappings,
        joinKey
      } = config;

      const result = [...targetData];
      const fillLog: any[] = [];

      // 为源数据创建快速查询索引
      const sourceMap = new Map();
      for (const row of sourceData) {
        const key = String(row[joinKey]).toLowerCase().trim();
        if (!sourceMap.has(key)) {
          sourceMap.set(key, []);
        }
        sourceMap.get(key).push(row);
      }

      // 填充每一行
      for (let i = 0; i < result.length; i++) {
        const targetRow = result[i];
        const targetKey = String(targetRow[joinKey]).toLowerCase().trim();

        const sourceMatches = sourceMap.get(targetKey) || [];

        if (sourceMatches.length > 0) {
          const sourceRow = sourceMatches[0]; // 使用第一个匹配

          for (const { sourceField, targetField } of mappings) {
            const sourceValue = sourceRow[sourceField];

            // 编码处理 - 防止乱码
            const value = this.sanitizeValue(sourceValue);

            result[i][targetField] = value;

            fillLog.push({
              rowIndex: i,
              sourceField,
              targetField,
              value,
              matched: true
            });
          }
        } else {
          fillLog.push({
            rowIndex: i,
            status: 'no_match',
            joinKey: targetKey
          });
        }
      }

      return {
        success: true,
        data: result,
        fillLog,
        summary: {
          totalRows: result.length,
          filled: fillLog.filter(l => l.matched).length,
          unfilled: fillLog.filter(l => l.status === 'no_match').length
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
   * 创建数据索引 - 加速查询
   */
  createIndex(data: any[], indexFields: string[]) {
    try {
      const indexes: any = {};

      for (const field of indexFields) {
        const fieldIndex = new Map();

        for (let i = 0; i < data.length; i++) {
          const value = String(data[i][field]).toLowerCase().trim();

          if (!fieldIndex.has(value)) {
            fieldIndex.set(value, []);
          }
          fieldIndex.get(value).push(i);
        }

        indexes[field] = Object.fromEntries(fieldIndex);
      }

      return {
        success: true,
        indexes,
        indexedFields: indexFields
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 使用索引进行批量查询
   */
  batchQuery(indexes: any, queries: Array<{ field: string; value: any }>) {
    try {
      const results: any[] = [];

      for (const query of queries) {
        const { field, value } = query;
        const fieldIndex = indexes[field];

        if (!fieldIndex) {
          results.push({ query, result: [], error: '字段索引不存在' });
          continue;
        }

        const key = String(value).toLowerCase().trim();
        const rowIndices = fieldIndex[key] || [];

        results.push({
          query,
          rowIndices,
          matchCount: rowIndices.length
        });
      }

      return {
        success: true,
        results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 在表格中搜索
   */
  searchInSheet(data: any[], query: string) {
    try {
      const results: any[] = [];

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];

        for (const [field, value] of Object.entries(row)) {
          if (String(value).includes(query)) {
            results.push({
              rowIndex,
              field,
              value,
              match: query
            });
          }
        }
      }

      return {
        success: true,
        results,
        matchCount: results.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 辅助方法：创建字符串索引
   */
  private createStringIndex(data: any[], field: string) {
    const index = new Map();

    for (const item of data) {
      const value = String(item[field]).toLowerCase().trim();
      if (!index.has(value)) {
        index.set(value, []);
      }
      index.get(value).push(item);
    }

    return index;
  }

  /**
   * 辅助方法：处理值编码，防止乱码
   */
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    // 如果是字符串，处理编码
    if (typeof value === 'string') {
      // 移除非法字符
      return value
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
        .trim();
    }

    return value;
  }
}

/**
 * 注册搜索IPC处理器
 */
export function registerSearchHandlers(ipcMain: any) {
  const searchService = new SearchService();

  ipcMain.handle('search:in-sheet', async (event, { filePath, sheetName, query }) => {
    // TODO: 实现从文件中搜索
    return {
      success: true,
      message: '功能开发中...'
    };
  });

  ipcMain.handle('search:fuzzy', async (event, { data, field, query, threshold }) => {
    return searchService.fuzzySearch(data, field, query, threshold);
  });

  ipcMain.handle('search:cross-join', async (event, config) => {
    return searchService.crossTableJoin(config);
  });

  ipcMain.handle('search:fill-data', async (event, config) => {
    return searchService.fillData(config);
  });

  ipcMain.handle('search:create-index', async (event, { data, indexFields }) => {
    return searchService.createIndex(data, indexFields);
  });

  ipcMain.handle('search:batch-query', async (event, { indexes, queries }) => {
    return searchService.batchQuery(indexes, queries);
  });
}
