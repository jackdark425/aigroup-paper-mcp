import { z } from 'zod';
import { getDriver, getEnabledDrivers } from '../drivers/index.js';
import { PlatformSource } from '../types/paper.js';
import { SearchQuery, SearchField } from '../types/search.js';
import { Logger } from '../core/logger.js';
import { parallelSearchManager, ParallelStrategy } from '../core/parallel-search.js';

const logger = new Logger('AdvancedSearchTool');

// 布尔查询解析器
interface BooleanQuery {
  type: 'term' | 'and' | 'or' | 'not';
  value?: string;
  children?: BooleanQuery[];
}

export const advancedSearchSchema = z.object({
  query: z.string().describe('Search query with boolean operators (AND, OR, NOT)'),
  sources: z.array(z.nativeEnum(PlatformSource)).optional()
    .describe('Specific platforms to search (leave empty for all enabled platforms)'),
  field: z.nativeEnum(SearchField).optional()
    .describe('Search field: all, title, abstract, author, keywords, fulltext'),
  fuzzyMatch: z.boolean().optional().default(false)
    .describe('Enable fuzzy matching for approximate search'),
  exactMatch: z.boolean().optional().default(false)
    .describe('Enable exact matching for precise search'),
  caseSensitive: z.boolean().optional().default(false)
    .describe('Enable case-sensitive search'),
  limit: z.number().int().positive().max(100).default(10)
    .describe('Maximum number of results per platform'),
  offset: z.number().int().min(0).default(0).optional()
    .describe('Offset for pagination'),
  parallelStrategy: z.nativeEnum(ParallelStrategy).optional()
    .describe('Parallel search strategy: full_parallel, batch_parallel, smart_parallel, sequential'),
  maxConcurrency: z.number().int().positive().max(20).optional()
    .describe('Maximum number of concurrent platform searches (default: 10)')
});

export type AdvancedSearchInput = z.infer<typeof advancedSearchSchema>;

/**
 * 解析布尔查询字符串
 */
function parseBooleanQuery(query: string): BooleanQuery {
  // 简单的布尔查询解析器
  // 支持: term1 AND term2, term1 OR term2, NOT term, (term1 AND term2) OR term3
  
  const normalized = query.trim();
  
  // 处理括号表达式
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    return parseBooleanQuery(normalized.slice(1, -1));
  }
  
  // 检查 AND 操作符 (优先级最高)
  const andIndex = findOperatorIndex(normalized, 'AND');
  if (andIndex !== -1) {
    return {
      type: 'and',
      children: [
        parseBooleanQuery(normalized.slice(0, andIndex).trim()),
        parseBooleanQuery(normalized.slice(andIndex + 3).trim())
      ]
    };
  }
  
  // 检查 OR 操作符
  const orIndex = findOperatorIndex(normalized, 'OR');
  if (orIndex !== -1) {
    return {
      type: 'or',
      children: [
        parseBooleanQuery(normalized.slice(0, orIndex).trim()),
        parseBooleanQuery(normalized.slice(orIndex + 2).trim())
      ]
    };
  }
  
  // 检查 NOT 操作符
  if (normalized.toUpperCase().startsWith('NOT ')) {
    return {
      type: 'not',
      children: [parseBooleanQuery(normalized.slice(4).trim())]
    };
  }
  
  // 基本术语
  return {
    type: 'term',
    value: normalized
  };
}

/**
 * 查找操作符位置，忽略引号内的内容
 */
function findOperatorIndex(query: string, operator: string): number {
  let inQuotes = false;
  const upperQuery = query.toUpperCase();
  const upperOperator = operator.toUpperCase();
  
  for (let i = 0; i < upperQuery.length; i++) {
    if (upperQuery[i] === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (!inQuotes && upperQuery.startsWith(upperOperator, i)) {
      // 确保操作符前后有空格或是字符串边界
      const before = i === 0 || /\s/.test(query[i - 1]);
      const after = i + operator.length === query.length || /\s/.test(query[i + operator.length]);
      
      if (before && after) {
        return i;
      }
    }
  }
  
  return -1;
}

/**
 * 将布尔查询转换为平台特定的查询字符串
 */
function buildPlatformQuery(ast: BooleanQuery, options: {
  fuzzyMatch: boolean;
  exactMatch: boolean;
  caseSensitive: boolean;
}): string {
  switch (ast.type) {
    case 'term':
      if (!ast.value) return '';
      
      if (options.exactMatch && !ast.value.includes('"')) {
        return `"${ast.value}"`;
      }
      
      if (options.fuzzyMatch && !options.exactMatch) {
        // 简单的模糊匹配实现 - 添加通配符或近似搜索
        return ast.value.split(/\s+/).map(term => {
          if (term.length > 3) {
            return `${term}~`;
          }
          return term;
        }).join(' ');
      }
      
      return ast.value;
      
    case 'and':
      if (!ast.children || ast.children.length === 0) return '';
      return ast.children.map(child => buildPlatformQuery(child, options)).join(' AND ');
      
    case 'or':
      if (!ast.children || ast.children.length === 0) return '';
      return ast.children.map(child => buildPlatformQuery(child, options)).join(' OR ');
      
    case 'not':
      if (!ast.children || ast.children.length === 0) return '';
      return `NOT ${buildPlatformQuery(ast.children[0], options)}`;
      
    default:
      return '';
  }
}

export async function advancedSearch(params: AdvancedSearchInput) {
  logger.info(`Advanced search: ${params.query}`);
  
  // 解析布尔查询
  const ast = parseBooleanQuery(params.query);
  logger.debug(`Parsed query AST: ${JSON.stringify(ast)}`);
  
  // 构建平台查询
  const platformQuery = buildPlatformQuery(ast, {
    fuzzyMatch: params.fuzzyMatch || false,
    exactMatch: params.exactMatch || false,
    caseSensitive: params.caseSensitive || false
  });
  
  logger.debug(`Platform query: ${platformQuery}`);
  
  const query: SearchQuery = {
    query: platformQuery,
    field: params.field,
    sources: params.sources,
    limit: params.limit,
    offset: params.offset,
    options: {
      fuzzyMatch: params.fuzzyMatch,
      caseSensitive: params.caseSensitive
    }
  };
  
  // 确定要使用的驱动
  const drivers = params.sources && params.sources.length > 0
    ? params.sources.map(source => getDriver(source)).filter(d => d !== undefined)
    : getEnabledDrivers();
  
  if (drivers.length === 0) {
    throw new Error('No enabled drivers available');
  }
  
  logger.info(`使用驱动数量: ${drivers.length}`);
  
  // 使用并行搜索管理器执行搜索
  const parallelConfig = {
    strategy: params.parallelStrategy || ParallelStrategy.SMART_PARALLEL,
    maxConcurrency: params.maxConcurrency || 10,
    enableDeduplication: true,
    enablePerformanceMonitoring: true,
    timeout: 30000
  };

  const { results: searchResults, metrics: parallelMetrics } = await parallelSearchManager.executeParallelSearch(
    drivers,
    query,
    parallelConfig
  );

  // 合并和去重结果
  const { papers: allPapers, totalBySource } = parallelSearchManager.mergeAndDeduplicateResults(
    searchResults,
    parallelConfig.enableDeduplication
  );
  
  // 收集警告信息
  const warnings = searchResults
    .filter(r => r.error)
    .map(r => `${r.source}: ${r.error!.message}`);
  
  return {
    papers: allPapers,
    total: allPapers.length,
    totalBySource,
    query: params.query,
    parsedQuery: ast,
    platformQuery,
    warnings: warnings.length > 0 ? warnings : undefined,
    parallelMetrics: {
      totalDuration: `${parallelMetrics.totalDuration}ms`,
      platformCount: parallelMetrics.platformCount,
      successfulPlatforms: parallelMetrics.successfulPlatforms,
      failedPlatforms: parallelMetrics.failedPlatforms,
      averageLatency: `${Math.round(parallelMetrics.averageLatency)}ms`,
      maxLatency: `${parallelMetrics.maxLatency}ms`,
      minLatency: `${parallelMetrics.minLatency}ms`,
      totalPapers: parallelMetrics.totalPapers,
      uniquePapers: parallelMetrics.uniquePapers,
      duplicatePapers: parallelMetrics.duplicatePapers,
      parallelEfficiency: `${(parallelMetrics.parallelEfficiency * 100).toFixed(1)}%`,
      platformMetrics: parallelMetrics.platformMetrics.map(m => ({
        source: m.source,
        success: m.success,
        latency: `${m.latency}ms`,
        paperCount: m.paperCount,
        error: m.error
      }))
    }
  };
}