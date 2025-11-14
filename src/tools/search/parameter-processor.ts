/**
 * 参数处理模块
 */

import { PlatformSource } from '../../types/paper.js';
import { SearchField } from '../../types/search.js';
import { Logger } from '../../core/logger.js';
import { smartSuggestionEngine } from '../../core/smart-suggestions.js';

const logger = new Logger('ParameterProcessor');

export interface ProcessedParameters {
  processedQuery: string;
  finalSources?: PlatformSource[];
  finalField?: SearchField;
  suggestions: any;
  warnings: string[];
}

export class ParameterProcessor {
  /**
   * 处理搜索参数，应用智能建议
   */
  static processSearchParameters(
    query: string,
    sources?: PlatformSource[],
    field?: SearchField,
    enableSmartSuggestions: boolean = true
  ): ProcessedParameters {
    let processedQuery = query;
    let finalSources = sources;
    let finalField = field;
    let suggestions: any = null;
    const warnings: string[] = [];

    if (enableSmartSuggestions) {
      const suggestionResult = smartSuggestionEngine.analyzeQuery(query, sources, field);

      suggestions = {
        processedQuery: suggestionResult.processedQuery,
        recommendedSources: suggestionResult.suggestedSources,
        queryCorrections: suggestionResult.queryCorrections,
        parameterSuggestions: suggestionResult.parameterSuggestions,
        confidence: suggestionResult.confidence
      };

      // 应用高置信度的查询修正
      if (suggestionResult.confidence > 0.6 && suggestionResult.processedQuery !== query) {
        processedQuery = suggestionResult.processedQuery;
        logger.info(`应用查询修正: "${query}" → "${processedQuery}"`);
      }

      // 如果没有指定平台，使用推荐的平台
      if (!finalSources || finalSources.length === 0) {
        finalSources = suggestionResult.suggestedSources;
        logger.info(`使用推荐平台: ${finalSources.join(', ')}`);
      }

      // 应用字段建议
      if (suggestionResult.suggestedField && !finalField && suggestionResult.confidence > 0.7) {
        finalField = suggestionResult.suggestedField as SearchField;
        logger.info(`应用字段建议: ${finalField}`);
      }

      // 记录警告和建议
      if (suggestionResult.queryCorrections.length > 0) {
        suggestionResult.queryCorrections.forEach(correction => {
          warnings.push(`${correction.reason}: "${correction.original}" → "${correction.suggested}"`);
        });
      }

      if (suggestionResult.parameterSuggestions.length > 0) {
        suggestionResult.parameterSuggestions.forEach(suggestion => {
          warnings.push(`参数建议: ${suggestion.parameter} - ${suggestion.reason}`);
        });
      }
    }

    return {
      processedQuery,
      finalSources,
      finalField,
      suggestions,
      warnings
    };
  }
}