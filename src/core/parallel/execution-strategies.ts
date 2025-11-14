/**
 * 并行执行策略模块
 */

import { SearchQuery, SearchResult } from '../../types/search.js';
import { Logger } from '../logger.js';
import { SearchTask } from './search-task.js';
import { ParallelSearchConfig } from './types.js';
import { platformHealthMonitor } from '../platform-health.js';

const logger = new Logger('ExecutionStrategies');

/**
 * 搜索结果包装
 */
export interface SearchResultWrapper {
  source: string;
  result?: SearchResult;
  error?: Error;
  latency: number;
  timestamp: Date;
}

/**
 * 执行策略类
 */
export class ExecutionStrategies {
  /**
   * 全并行执行
   */
  static async executeFullParallel(
    tasks: SearchTask[],
    query: SearchQuery,
    config: ParallelSearchConfig
  ): Promise<SearchResultWrapper[]> {
    logger.debug('执行全并行搜索');
    
    const promises = tasks.map(task => this.executeSearchTask(task, query, config));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          source: tasks[index].source,
          error: result.reason,
          latency: 0,
          timestamp: new Date()
        };
      }
    });
  }

  /**
   * 批量并行执行
   */
  static async executeBatchParallel(
    tasks: SearchTask[],
    query: SearchQuery,
    config: ParallelSearchConfig
  ): Promise<SearchResultWrapper[]> {
    const batchSize = config.batchSize || 3;
    logger.debug(`执行批量并行搜索，批次大小: ${batchSize}`);
    
    const results: SearchResultWrapper[] = [];
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      logger.debug(`处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`);
      
      const batchPromises = batch.map(task => this.executeSearchTask(task, query, config));
      const batchResults = await Promise.allSettled(batchPromises);
      
      const processedResults = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            source: batch[index].source,
            error: result.reason,
            latency: 0,
            timestamp: new Date()
          };
        }
      });
      
      results.push(...processedResults);
    }
    
    return results;
  }

  /**
   * 智能并行执行
   */
  static async executeSmartParallel(
    tasks: SearchTask[],
    query: SearchQuery,
    config: ParallelSearchConfig,
    maxConcurrency: number
  ): Promise<SearchResultWrapper[]> {
    logger.debug('执行智能并行搜索');
    
    const results: SearchResultWrapper[] = [];
    const executing: Promise<SearchResultWrapper>[] = [];
    let taskIndex = 0;

    logger.debug(`智能并发数: ${maxConcurrency}`);

    while (taskIndex < tasks.length || executing.length > 0) {
      while (executing.length < maxConcurrency && taskIndex < tasks.length) {
        const task = tasks[taskIndex++];
        const promise = this.executeSearchTask(task, query, config);
        executing.push(promise);
      }

      if (executing.length > 0) {
        const result = await Promise.race(executing);
        results.push(result);
        
        const index = executing.findIndex(async p => await p === result);
        if (index !== -1) {
          executing.splice(index, 1);
        }
      }
    }

    return results;
  }

  /**
   * 顺序执行
   */
  static async executeSequential(
    tasks: SearchTask[],
    query: SearchQuery,
    config: ParallelSearchConfig
  ): Promise<SearchResultWrapper[]> {
    logger.debug('执行顺序搜索');
    
    const results: SearchResultWrapper[] = [];
    
    for (const task of tasks) {
      try {
        const result = await this.executeSearchTask(task, query, config);
        results.push(result);
      } catch (error: any) {
        results.push({
          source: task.source,
          error,
          latency: 0,
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }

  /**
   * 执行单个搜索任务
   */
  private static async executeSearchTask(
    task: SearchTask,
    query: SearchQuery,
    config: ParallelSearchConfig
  ): Promise<SearchResultWrapper> {
    const startTime = Date.now();
    
    try {
      logger.debug(`开始搜索平台: ${task.source}`);
      
      const result = await platformHealthMonitor.executeWithRetry(
        task.source,
        async () => {
          const searchPromise = task.driver.search(query);
          
          if (config.timeout) {
            return await this.withTimeout(searchPromise, config.timeout);
          }
          
          return await searchPromise;
        }
      );
      
      const latency = Date.now() - startTime;
      
      return {
        source: task.source,
        result,
        latency,
        timestamp: new Date()
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      logger.warn(`搜索失败: ${task.source}`, { error: error.message });
      
      return {
        source: task.source,
        error,
        latency,
        timestamp: new Date()
      };
    }
  }

  /**
   * 超时包装器
   */
  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`搜索超时: ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}