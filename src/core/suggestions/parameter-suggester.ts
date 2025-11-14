/**
 * 参数建议器模块
 */

import { PlatformSource } from '../../types/paper.js';
import { PlatformRecommender } from './platform-recommender.js';
import { QueryAnalyzer } from './query-analyzer.js';

/**
 * 参数建议
 */
export interface ParameterSuggestion {
  parameter: string;
  currentValue?: any;
  suggestedValue: any;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * 参数建议器
 */
export class ParameterSuggester {
  /**
   * 生成参数建议
   */
  static generateParameterSuggestions(
    query: string, 
    currentSources?: PlatformSource[], 
    currentField?: string
  ): ParameterSuggestion[] {
    const suggestions: ParameterSuggestion[] = [];

    // 平台建议
    const recommendedPlatforms = PlatformRecommender.recommendPlatforms(query, currentSources);
    if (currentSources && currentSources.length > 0) {
      const missingPlatforms = recommendedPlatforms.filter(p => !currentSources.includes(p));
      if (missingPlatforms.length > 0) {
        suggestions.push({
          parameter: 'sources',
          currentValue: currentSources,
          suggestedValue: recommendedPlatforms,
          reason: `基于查询主题推荐添加这些平台以获得更全面的结果`,
          impact: 'medium'
        });
      }
    }

    // 字段建议
    const suggestedField = QueryAnalyzer.suggestSearchField(query, currentField);
    if (suggestedField && suggestedField !== currentField) {
      suggestions.push({
        parameter: 'field',
        currentValue: currentField,
        suggestedValue: suggestedField,
        reason: `基于查询特征推荐使用${suggestedField}字段进行搜索`,
        impact: 'low'
      });
    }

    // 限制建议
    if (query.length > 30) {
      suggestions.push({
        parameter: 'limit',
        currentValue: undefined,
        suggestedValue: 20,
        reason: '复杂查询可能需要更多结果来找到相关论文',
        impact: 'low'
      });
    }

    return suggestions;
  }

  /**
   * 计算整体置信度
   */
  static calculateConfidence(
    processedQuery: string,
    suggestedSources: PlatformSource[],
    queryCorrections: any[],
    parameterSuggestions: ParameterSuggestion[]
  ): number {
    let confidence = 0.5;

    if (processedQuery.length >= 5) {
      confidence += 0.2;
    }

    if (suggestedSources.length >= 2) {
      confidence += 0.15;
    }

    if (queryCorrections.length > 0 || parameterSuggestions.length > 0) {
      confidence += 0.15;
    }

    return Math.min(1, confidence);
  }
}