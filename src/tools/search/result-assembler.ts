/**
 * 结果组装器模块
 */

import { EnhancedSearchResult } from '../../types/paper.js';
import { Logger } from '../../core/logger.js';
import { ResultEnhancer } from '../../core/result-enhancer.js';
import { parallelSearchManager } from '../../core/parallel-search.js';

const logger = new Logger('ResultAssembler');

export class ResultAssembler {
  /**
   * 组装搜索结果
   */
  static async assembleSearchResult(
    searchResults: any[],
    metrics: any,
    processedQuery: string,
    enableEnhancement: boolean,
    enableDeduplication: boolean,
    warnings: string[],
    suggestions: any,
    strategyInfo: any,
    enableSmartSuggestions: boolean,
    enableSearchStrategy: boolean,
    enablePerformanceMonitoring: boolean
  ): Promise<EnhancedSearchResult> {
    // 合并和去重结果
    const { papers: allPapers, totalBySource } = parallelSearchManager.mergeAndDeduplicateResults(
      searchResults,
      enableDeduplication
    );

    // 收集警告信息
    const driverWarnings = searchResults
      .filter(r => r.error)
      .map(r => `${r.source}: ${r.error!.message}`);

    if (driverWarnings.length > 0) {
      warnings.push(...driverWarnings);
    }

    // 应用结果增强
    let result: EnhancedSearchResult;
    if (enableEnhancement && allPapers.length > 0) {
      logger.info('开始增强搜索结果...');
      result = await ResultEnhancer.enhanceSearchResult(allPapers, processedQuery);
      
      if (warnings.length > 0) {
        result.warnings = warnings;
      }
      
      logger.info(`结果增强完成, 高影响力论文数: ${result.highImpactPapers?.length || 0}`);
    } else {
      result = {
        papers: allPapers,
        total: allPapers.length,
        totalBySource,
        query: processedQuery,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // 添加智能建议信息
    if (enableSmartSuggestions && suggestions) {
      result.suggestions = suggestions;
    }

    // 添加搜索策略信息
    if (enableSearchStrategy && strategyInfo) {
      result.searchStrategy = strategyInfo;
    }

    // 添加并行搜索性能指标
    if (enablePerformanceMonitoring) {
      result.parallelMetrics = {
        totalDuration: `${metrics.totalDuration}ms`,
        platformCount: metrics.platformCount,
        successfulPlatforms: metrics.successfulPlatforms,
        failedPlatforms: metrics.failedPlatforms,
        averageLatency: `${Math.round(metrics.averageLatency)}ms`,
        maxLatency: `${metrics.maxLatency}ms`,
        minLatency: `${metrics.minLatency}ms`,
        totalPapers: metrics.totalPapers,
        uniquePapers: metrics.uniquePapers,
        duplicatePapers: metrics.duplicatePapers,
        parallelEfficiency: `${(metrics.parallelEfficiency * 100).toFixed(1)}%`,
        platformMetrics: metrics.platformMetrics.map((m: any) => ({
          source: m.source,
          success: m.success,
          latency: `${m.latency}ms`,
          paperCount: m.paperCount,
          error: m.error
        }))
      };

      logger.info('并行搜索性能', {
        duration: metrics.totalDuration,
        efficiency: (metrics.parallelEfficiency * 100).toFixed(1) + '%',
        deduplication: `${metrics.totalPapers} -> ${metrics.uniquePapers}`
      });
    }

    return result;
  }
}