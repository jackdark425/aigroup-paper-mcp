/**
 * 搜索执行器模块
 */

import { PlatformSource } from '../../types/paper.js';
import { SearchQuery } from '../../types/search.js';
import { IDriver } from '../../types/driver.js';
import { Logger } from '../../core/logger.js';
import { selectSmartDrivers, getDriver, getEnabledDrivers } from '../../drivers/base/driver-factory.js';
import { searchStrategyManager } from '../../core/search-strategy.js';
import { platformHealthMonitor } from '../../core/platform-health.js';
import { parallelSearchManager, ParallelStrategy } from '../../core/parallel-search.js';
import { config } from '../../config/index.js';

const logger = new Logger('SearchExecutor');

export interface SearchExecutionResult {
  searchResults: any[];
  metrics: any;
  strategyInfo: any;
  drivers: IDriver[];
}

export class SearchExecutor {
  /**
   * 选择驱动器
   */
  static selectDrivers(
    query: SearchQuery,
    finalSources?: PlatformSource[],
    enableSearchStrategy: boolean = true
  ): { drivers: IDriver[]; strategyInfo: any } {
    let drivers;
    let strategyInfo: any = null;

    if (enableSearchStrategy) {
      const strategyConfig = config.searchStrategy;
      
      drivers = selectSmartDrivers(query, finalSources);
      
      if (drivers.length === 0) {
        throw new Error('没有可用的健康驱动');
      }

      const selectionResult = searchStrategyManager.selectPlatforms(query, strategyConfig);
      const parallelStrategyInfo = searchStrategyManager.optimizeParallelStrategy(
        drivers.map(d => d.source),
        strategyConfig
      );

      strategyInfo = {
        selectedPlatforms: drivers.map(d => d.source),
        selectionReasons: selectionResult.reasons,
        confidence: selectionResult.confidence,
        parallelStrategy: parallelStrategyInfo.strategy,
        fallbackPlatforms: selectionResult.fallbackPlatforms,
        healthStatus: Array.from(platformHealthMonitor.getAllMetrics().entries()).map(([source, metrics]) => ({
          source,
          isHealthy: metrics.isHealthy,
          successRate: metrics.successRate,
          averageLatency: metrics.averageLatency
        }))
      };

      logger.info('搜索策略', {
        platforms: drivers.map(d => d.source),
        strategy: parallelStrategyInfo.strategy,
        confidence: selectionResult.confidence
      });
    } else {
      const driverList = finalSources && finalSources.length > 0
        ? finalSources.map(source => getDriver(source))
        : getEnabledDrivers();
      
      drivers = driverList.filter((d: any): d is IDriver => d !== undefined);

      if (drivers.length === 0) {
        throw new Error('没有可用的驱动');
      }
    }

    return { drivers, strategyInfo };
  }

  /**
   * 执行并行搜索
   */
  static async executeParallelSearch(
    drivers: IDriver[],
    query: SearchQuery,
    parallelStrategy?: ParallelStrategy,
    maxConcurrency?: number
  ) {
    const parallelConfig = {
      strategy: parallelStrategy || ParallelStrategy.SMART_PARALLEL,
      maxConcurrency: maxConcurrency || 10,
      enableDeduplication: true,
      enablePerformanceMonitoring: true,
      timeout: 30000
    };

    logger.info(`使用驱动数量: ${drivers.length}`);

    const { results, metrics } = await parallelSearchManager.executeParallelSearch(
      drivers,
      query,
      parallelConfig
    );

    return { results, metrics, parallelConfig };
  }

  /**
   * 处理降级策略
   */
  static async handleFallback(
    allPapers: any[],
    strategyInfo: any,
    query: SearchQuery,
    parallelConfig: any,
    enableSearchStrategy: boolean
  ): Promise<any[]> {
    if (allPapers.length === 0 && enableSearchStrategy && strategyInfo?.fallbackPlatforms?.length > 0) {
      logger.warn('所有主要平台失败，尝试降级平台');

      const fallbackDrivers = strategyInfo.fallbackPlatforms
        .map((source: PlatformSource) => getDriver(source))
        .filter((d: any): d is IDriver => d !== undefined);

      if (fallbackDrivers.length > 0) {
        const { results: fallbackResults } = await parallelSearchManager.executeParallelSearch(
          fallbackDrivers,
          query,
          parallelConfig
        );

        const { papers: fallbackPapers } = parallelSearchManager.mergeAndDeduplicateResults(
          fallbackResults,
          false
        );

        return fallbackPapers;
      }
    }

    return [];
  }
}