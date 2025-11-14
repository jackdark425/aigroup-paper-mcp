/**
 * 并行搜索管理器 - 主入口
 */

import { IDriver } from '../types/driver.js';
import { SearchQuery } from '../types/search.js';
import { Logger } from './logger.js';
import { SearchTaskManager } from './parallel/search-task.js';
import { ExecutionStrategies, SearchResultWrapper } from './parallel/execution-strategies.js';
import { ResultProcessor } from './parallel/result-processor.js';
import {
  ParallelStrategy,
  ParallelSearchConfig,
  ParallelSearchMetrics
} from './parallel/types.js';

const logger = new Logger('ParallelSearchManager');

// 导出类型
export { ParallelStrategy } from './parallel/types.js';
export type { ParallelSearchConfig, ParallelSearchMetrics } from './parallel/types.js';

/**
 * 并行搜索管理器
 */
export class ParallelSearchManager {
  private static instance: ParallelSearchManager;
  private config: ParallelSearchConfig;

  private constructor(config?: Partial<ParallelSearchConfig>) {
    this.config = {
      strategy: ParallelStrategy.SMART_PARALLEL,
      maxConcurrency: 10,
      batchSize: 3,
      timeout: 30000,
      enableStreaming: false,
      enableDeduplication: true,
      enablePerformanceMonitoring: true,
      ...config
    };
  }

  static getInstance(config?: Partial<ParallelSearchConfig>): ParallelSearchManager {
    if (!ParallelSearchManager.instance) {
      ParallelSearchManager.instance = new ParallelSearchManager(config);
    }
    return ParallelSearchManager.instance;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ParallelSearchConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('并行搜索配置已更新', this.config);
  }

  /**
   * 执行并行搜索
   */
  async executeParallelSearch(
    drivers: IDriver[],
    query: SearchQuery,
    config?: Partial<ParallelSearchConfig>
  ): Promise<{
    results: SearchResultWrapper[];
    metrics: ParallelSearchMetrics;
  }> {
    const finalConfig = { ...this.config, ...config };
    const startTime = Date.now();

    logger.info(`开始并行搜索，策略: ${finalConfig.strategy}，平台数: ${drivers.length}`);

    // 创建搜索任务并按优先级排序
    const tasks = SearchTaskManager.createSearchTasks(drivers);
    
    // 根据策略执行搜索
    let results: SearchResultWrapper[];
    switch (finalConfig.strategy) {
      case ParallelStrategy.FULL_PARALLEL:
        results = await ExecutionStrategies.executeFullParallel(tasks, query, finalConfig);
        break;
      case ParallelStrategy.BATCH_PARALLEL:
        results = await ExecutionStrategies.executeBatchParallel(tasks, query, finalConfig);
        break;
      case ParallelStrategy.SMART_PARALLEL:
        const maxConcurrency = SearchTaskManager.calculateOptimalConcurrency(tasks, finalConfig.maxConcurrency);
        results = await ExecutionStrategies.executeSmartParallel(tasks, query, finalConfig, maxConcurrency);
        break;
      case ParallelStrategy.SEQUENTIAL:
        results = await ExecutionStrategies.executeSequential(tasks, query, finalConfig);
        break;
      default:
        const defaultConcurrency = SearchTaskManager.calculateOptimalConcurrency(tasks, finalConfig.maxConcurrency);
        results = await ExecutionStrategies.executeSmartParallel(tasks, query, finalConfig, defaultConcurrency);
    }

    // 计算性能指标
    const metrics = ResultProcessor.calculateMetrics(results, startTime, drivers.length);

    logger.info('并行搜索完成', {
      duration: metrics.totalDuration,
      successful: metrics.successfulPlatforms,
      failed: metrics.failedPlatforms,
      efficiency: metrics.parallelEfficiency
    });

    return { results, metrics };
  }

  /**
   * 合并和去重搜索结果
   */
  mergeAndDeduplicateResults(
    results: SearchResultWrapper[],
    enableDeduplication: boolean = true
  ) {
    return ResultProcessor.mergeAndDeduplicateResults(results, enableDeduplication);
  }
}

// 导出单例
export const parallelSearchManager = ParallelSearchManager.getInstance();