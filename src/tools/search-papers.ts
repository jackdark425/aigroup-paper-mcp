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
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(2000, 'Query too long (max 2000 characters)')
    .describe('Search query keywords'),
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
 * 验证和清理查询
 */
function validateAndCleanQuery(query: string): string {
  // 移除前后空格
  const trimmed = query.trim();
  
  // 检查是否为空
  if (!trimmed) {
    throw new Error('Query cannot be empty');
  }
  
  // 移除潜在的危险字符
  const cleaned = trimmed
    .replace(/[;]/g, ' ')  // 移除分号
    .replace(/--/g, ' ')   // 移除SQL注释符
    .replace(/\/\*/g, ' ') // 移除块注释开始
    .replace(/\*\//g, ' ') // 移除块注释结束
    .trim();
  
  // 再次检查清理后是否为空
  if (!cleaned) {
    throw new Error('Query contains no valid search terms');
  }
  
  // 检查长度是否超过合理范围
  if (cleaned.length > 2000) {
    logger.warn(`Query too long (${cleaned.length} chars), truncating to 2000 chars`);
    return cleaned.substring(0, 2000).trim();
  }
  
  return cleaned;
}

/**
 * 增强的搜索论文函数，集成智能建议、搜索策略优化和结果增强
 */
export async function searchPapers(params: SearchPapersInput): Promise<EnhancedSearchResult> {
  // 验证和清理查询
  let processedQuery: string;
  try {
    processedQuery = validateAndCleanQuery(params.query);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid query';
    logger.error('Query validation failed', { error: errorMessage, query: params.query });
    
    const now = new Date();
    return {
      papers: [],
      total: 0,
      totalBySource: {},
      query: params.query,
      warnings: [errorMessage],
      enhancedStats: {
        citationStats: {
          totalCitations: 0,
          averageCitations: 0,
          maxCitations: 0,
          citationDistribution: []
        },
        timeStats: {
          oldestPaper: now,
          newestPaper: now,
          publicationYears: []
        },
        platformStats: {},
        impactStats: {
          highImpactCount: 0,
          mediumImpactCount: 0,
          lowImpactCount: 0,
          averageImpactScore: 0
        }
      }
    };
  }

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
    processedQuery: finalQuery,
    finalSources,
    finalField,
    suggestions,
    warnings
  } = ParameterProcessor.processSearchParameters(
    processedQuery,
    searchParams.sources,
    searchParams.field,
    enableSmartSuggestions
  );

  // 2. 构建搜索查询
  const query: SearchQuery = {
    query: finalQuery,
    field: finalField,
    sources: finalSources,
    categories: searchParams.categories,
    sortBy: searchParams.sortBy,
    sortOrder: searchParams.sortOrder,
    limit: searchParams.limit,
    offset: searchParams.offset
  };

  logger.info(`搜索论文: ${finalQuery}`, {
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
    finalQuery,
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