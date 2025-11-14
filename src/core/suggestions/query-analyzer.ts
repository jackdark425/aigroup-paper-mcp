/**
 * 查询分析器模块
 */

import { QUERY_PREPROCESSING_CONFIG } from '../../config/platform-recommendations.js';

/**
 * 查询修正
 */
export interface QueryCorrection {
  type: 'spelling' | 'operator' | 'field' | 'format';
  original: string;
  suggested: string;
  reason: string;
}

/**
 * 查询分析器
 */
export class QueryAnalyzer {
  /**
   * 查询预处理
   */
  static preprocessQuery(query: string): string {
    let processed = query.trim();
    
    // 检查常见拼写错误
    for (const [wrong, correct] of Object.entries(QUERY_PREPROCESSING_CONFIG.commonMisspellings)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      processed = processed.replace(regex, correct);
    }

    // 标准化布尔运算符
    QUERY_PREPROCESSING_CONFIG.booleanOperators.forEach(operator => {
      const regex = new RegExp(`\\b${operator.toLowerCase()}\\b`, 'gi');
      processed = processed.replace(regex, operator.toUpperCase());
    });

    // 移除多余空格
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  /**
   * 检测查询修正
   */
  static detectQueryCorrections(original: string, processed: string): QueryCorrection[] {
    const corrections: QueryCorrection[] = [];

    if (original !== processed) {
      corrections.push({
        type: 'spelling',
        original,
        suggested: processed,
        reason: '自动修正了拼写错误和标准化了查询格式'
      });
    }

    // 检测可能的字段限定符
    const fieldPatterns = Object.entries(QUERY_PREPROCESSING_CONFIG.fieldSuggestions);
    for (const [pattern, field] of fieldPatterns) {
      if (processed.toLowerCase().includes(pattern) && !processed.includes(':')) {
        corrections.push({
          type: 'field',
          original: processed,
          suggested: `${field}:${processed}`,
          reason: `检测到可能想要搜索${field}字段`
        });
        break;
      }
    }

    return corrections;
  }

  /**
   * 建议搜索字段
   */
  static suggestSearchField(query: string, currentField?: string): string | undefined {
    if (query.length < 10 && !currentField) {
      return 'title';
    }

    if (this.looksLikeAuthorName(query) && !currentField) {
      return 'author';
    }

    if (query.length > 50 && !currentField) {
      return 'fulltext';
    }

    return currentField;
  }

  /**
   * 判断查询是否像作者名
   */
  private static looksLikeAuthorName(query: string): boolean {
    const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
    return namePattern.test(query.trim());
  }
}