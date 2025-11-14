/**
 * 搜索论文工具 - 主入口
 */

import { z } from 'zod';
import { PlatformSource, EnhancedSearchResult } from '../types/paper.js';
import { SearchQuery, SearchField, SortField, SortOrder } from '../types/search.js';
import { Logger } from '../core/logger.js';
import { ParallelStrategy } from '../core/parallel-search.js';
import { ParameterProcessor } from './search/parameter-processor.js';
import { SearchExecutor } from './search/search-executor.js';
import { ResultAssembler } from './search/result-assembler.js';

const logger = new Logger('SearchPapersTool');

export const searchPapersSchema = z.object({
  query: z.string().describe('Search query keywords'),
  sources: z.array(z.nativeEnum(PlatformSource)).optional()
    .describe('Specific platforms to search (leave empty for all enabled platforms)'),
  field: z.nativeEnum(SearchField).optional()
    .describe('Search field: all, title, abstract, author, keywords, fulltext'),
  categories: z.array(z.string()).optional()
    .describe('Filter by categories/subjects'),
  sortBy: z.nativeEnum(SortField).optional()
    .describe('Sort by: relevance, date, citations, title'),
  sortOrder: z.nativeEnum(SortOrder).optional()
    .describe('Sort order: asc, desc'),
  limit: z.number().int().positive().max(100).default(10)
    .describe('Maximum number of results per platform'),
  offset: z.number().int().min(0).default(0).optional()
    .describe('Offset for pagination'),
  enableSmartSuggestions: z.boolean().default(true)
    .describe('Enable smart parameter suggestions and query preprocessing'),
  enableEnhancement: z.boolean().default(true)
    .describe('Enable result enhancement (impact scoring, summary generation, etc.)'),
  enableSearchStrategy: z.boolean().default(true)
    .describe('Enable intelligent search strategy optimization'),
  parallelStrategy: z.nativeEnum(ParallelStrategy).optional()
    .describe('Parallel search strategy: full_parallel, batch_parallel, smart_parallel, sequential'),
  maxConcurrency: z.number().int().positive().max(20).optional()
    .describe('Maximum number of concurrent platform searches (default: 10)')
});

export type SearchPapersInput = z.infer<typeof searchPapersSchema>;

/**
 * 增强的搜索论文函数，集成智能建议、搜索策略优化和结果增强
 */
export async function searchPapers(params: SearchPapersInput): Promise<EnhancedSearchResult> {
  const {
    enableSmartSuggestions = true,
    enableEnhancement = true,
    enableSearchStrategy = true,
    parallelStrategy,
    maxConcurrency,
    ...searchParams
  } = params;

  // 1. 处理参数
  const {
    processedQuery,
    finalSources,
    finalField,
    suggestions,
    warnings
  } = ParameterProcessor.processSearchParameters(
    searchParams.query,
    searchParams.sources,
    searchParams.field,
    enableSmartSuggestions
  );

  // 2. 构建搜索查询
  const query: SearchQuery = {
    query: processedQuery,
    field: finalField,
    sources: finalSources,
    categories: searchParams.categories,
    sortBy: searchParams.sortBy,
    sortOrder: searchParams.sortOrder,
    limit: searchParams.limit,
    offset: searchParams.offset
  };

  logger.info(`搜索论文: ${processedQuery}`, {
    field: finalField,
    enableSmartSuggestions,
    enableEnhancement,
    enableSearchStrategy
  });

  // 3. 选择驱动器
  const { drivers, strategyInfo } = SearchExecutor.selectDrivers(
    query,
    finalSources,
    enableSearchStrategy
  );

  // 4. 执行并行搜索
  const { results: searchResults, metrics, parallelConfig } = await SearchExecutor.executeParallelSearch(
    drivers,
    query,
    parallelStrategy,
    maxConcurrency
  );

  // 5. 合并结果
  const { parallelSearchManager } = await import('../core/parallel-search.js');
  let { papers: allPapers } = parallelSearchManager.mergeAndDeduplicateResults(
    searchResults,
    parallelConfig.enableDeduplication
  );

  // 6. 处理降级策略
  const fallbackPapers = await SearchExecutor.handleFallback(
    allPapers,
    strategyInfo,
    query,
    parallelConfig,
    enableSearchStrategy
  );

  if (fallbackPapers.length > 0) {
    warnings.push('主要平台搜索失败，正在尝试备选平台');
    allPapers.push(...fallbackPapers);
  }

  // 7. 组装并返回结果
  return await ResultAssembler.assembleSearchResult(
    searchResults,
    metrics,
    processedQuery,
    enableEnhancement,
    parallelConfig.enableDeduplication,
    warnings,
    suggestions,
    strategyInfo,
    enableSmartSuggestions,
    enableSearchStrategy,
    parallelConfig.enablePerformanceMonitoring
  );
}