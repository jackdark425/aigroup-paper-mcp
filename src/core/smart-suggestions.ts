/**
 * 智能建议引擎 - 主入口
 */

import { PlatformSource } from '../types/paper.js';
import { QueryAnalyzer, QueryCorrection } from './suggestions/query-analyzer.js';
import { PlatformRecommender } from './suggestions/platform-recommender.js';
import { ParameterSuggester, ParameterSuggestion } from './suggestions/parameter-suggester.js';

// 导出类型
export type { QueryCorrection } from './suggestions/query-analyzer.js';
export type { PlatformRecommendation } from './suggestions/platform-recommender.js';
export type { ParameterSuggestion } from './suggestions/parameter-suggester.js';

/**
 * 智能参数建议结果
 */
export interface SmartSuggestionResult {
  originalQuery: string;
  processedQuery: string;
  suggestedSources: PlatformSource[];
  suggestedField?: string;
  queryCorrections: QueryCorrection[];
  parameterSuggestions: ParameterSuggestion[];
  confidence: number;
}

/**
 * 智能参数建议引擎
 */
export class SmartSuggestionEngine {
  /**
   * 分析查询并生成智能建议
   */
  analyzeQuery(query: string, currentSources?: PlatformSource[], currentField?: string): SmartSuggestionResult {
    const processedQuery = QueryAnalyzer.preprocessQuery(query);
    const queryCorrections = QueryAnalyzer.detectQueryCorrections(query, processedQuery);
    const suggestedSources = PlatformRecommender.recommendPlatforms(processedQuery, currentSources);
    const suggestedField = QueryAnalyzer.suggestSearchField(processedQuery, currentField);
    const parameterSuggestions = ParameterSuggester.generateParameterSuggestions(
      processedQuery, 
      currentSources, 
      currentField
    );

    const confidence = ParameterSuggester.calculateConfidence(
      processedQuery,
      suggestedSources,
      queryCorrections,
      parameterSuggestions
    );

    return {
      originalQuery: query,
      processedQuery,
      suggestedSources,
      suggestedField,
      queryCorrections,
      parameterSuggestions,
      confidence
    };
  }

  /**
   * 推荐平台
   */
  recommendPlatforms(query: string, currentSources?: PlatformSource[]): PlatformSource[] {
    return PlatformRecommender.recommendPlatforms(query, currentSources);
  }

  /**
   * 验证平台列表
   */
  validatePlatforms(sources: PlatformSource[]): { valid: PlatformSource[]; invalid: string[] } {
    return PlatformRecommender.validatePlatforms(sources);
  }

  /**
   * 获取所有可用平台
   */
  getAllAvailablePlatforms(): PlatformSource[] {
    return PlatformRecommender.getAllAvailablePlatforms();
  }

  /**
   * 获取平台详细信息
   */
  getPlatformDetails(source: PlatformSource) {
    return PlatformRecommender.getPlatformDetails(source);
  }
}

// 导出单例实例
export const smartSuggestionEngine = new SmartSuggestionEngine();