import { Logger } from '../../core/logger.js';
import { parallelSearchManager } from '../../core/parallel-search.js';
import { SearchQuery, SortField, SortOrder } from '../../types/search.js';
import type { SearchResultWrapper } from '../../core/parallel/execution-strategies.js';

const logger = new Logger('TrendSearchExecutor');

/**
 * 带超时的搜索函数
 */
export async function searchWithTimeout(
  drivers: any[],
  query: SearchQuery,
  timeout: number
): Promise<any[]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Search timeout after ${timeout}ms`)), timeout);
  });

  const searchPromise = (async () => {
    try {
      const { results } = await parallelSearchManager.executeParallelSearch(drivers, query, {
        timeout: timeout - 1000, // 给并行搜索留出一些时间
        maxConcurrency: 2 // 限制并发数
      });
      
      // 正确处理 SearchResultWrapper 类型
      return results
        .filter((r: SearchResultWrapper) => !r.error && r.result)
        .flatMap((r: SearchResultWrapper) => r.result?.papers || []);
    } catch (error) {
      logger.warn('Parallel search failed, falling back to sequential search', { error });
      
      // 降级到顺序搜索
      const papers: any[] = [];
      for (const driver of drivers) {
        try {
          const result = await driver.search(query);
          papers.push(...(result.papers || []));
        } catch (driverError) {
          logger.warn(`Driver ${driver.source} failed`, { error: driverError });
        }
      }
      return papers;
    }
  })();

  return Promise.race([searchPromise, timeoutPromise]);
}

/**
 * 为时间区间搜索论文
 */
export async function searchForPeriod(
  drivers: any[],
  topic: string,
  sources: any[] | undefined,
  limit: number,
  timePerInterval: number,
  start: Date,
  end: Date
): Promise<any[]> {
  // 构建时间范围查询 - 简化查询避免过多过滤
  const fullQuery = topic;
  
  const query: SearchQuery = {
    query: fullQuery,
    sources: sources,
    limit: Math.min(limit, 50), // 限制每区间论文数
    sortBy: SortField.DATE,
    sortOrder: SortOrder.DESC
  };
  
  // 使用带超时的搜索
  const periodPapers = await searchWithTimeout(drivers, query, timePerInterval);
  
  // 过滤当前时间区间的论文
  return periodPapers.filter(paper => {
    if (!paper.publishedDate) return false;
    const paperDate = new Date(paper.publishedDate);
    return paperDate >= start && paperDate <= end;
  });
}