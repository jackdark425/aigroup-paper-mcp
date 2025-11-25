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
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(2000, 'Query too long (max 2000 characters)')
    .describe('Search query with boolean operators (AND, OR, NOT)'),
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
 * 改进的布尔查询解析器 - 正确处理括号和嵌套表达式
 */
function parseBooleanQuery(query: string): BooleanQuery {
  const normalized = query.trim();
  
  if (!normalized) {
    return { type: 'term', value: '' };
  }
  
  // 移除最外层的括号（如果整个表达式被括号包围）
  const stripped = stripOuterParentheses(normalized);
  if (stripped !== normalized) {
    return parseBooleanQuery(stripped);
  }
  
  // 按优先级查找操作符：OR < AND < NOT
  // 从左到右查找 OR（优先级最低）
  const orIndex = findTopLevelOperator(normalized, 'OR');
  if (orIndex !== -1) {
    return {
      type: 'or',
      children: [
        parseBooleanQuery(normalized.slice(0, orIndex).trim()),
        parseBooleanQuery(normalized.slice(orIndex + 2).trim())
      ]
    };
  }
  
  // 查找 AND
  const andIndex = findTopLevelOperator(normalized, 'AND');
  if (andIndex !== -1) {
    return {
      type: 'and',
      children: [
        parseBooleanQuery(normalized.slice(0, andIndex).trim()),
        parseBooleanQuery(normalized.slice(andIndex + 3).trim())
      ]
    };
  }
  
  // 查找 NOT（只在开头）
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
 * 移除最外层的括号（如果整个表达式被一对括号包围）
 */
function stripOuterParentheses(query: string): string {
  if (!query.startsWith('(') || !query.endsWith(')')) {
    return query;
  }
  
  // 验证括号是否匹配且包围整个表达式
  let depth = 0;
  for (let i = 0; i < query.length; i++) {
    if (query[i] === '(') depth++;
    if (query[i] === ')') depth--;
    
    // 如果在结尾前depth变为0，说明括号不是包围整个表达式
    if (depth === 0 && i < query.length - 1) {
      return query;
    }
  }
  
  // 括号匹配且包围整个表达式，移除
  return query.slice(1, -1).trim();
}

/**
 * 查找顶层操作符位置（忽略引号和括号内的内容）
 * 从左到右查找，确保右结合性
 */
function findTopLevelOperator(query: string, operator: string): number {
  let inQuotes = false;
  let parenthesesDepth = 0;
  const upperQuery = query.toUpperCase();
  const upperOperator = operator.toUpperCase();
  
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    
    // 处理引号
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    // 处理括号
    if (!inQuotes) {
      if (char === '(') parenthesesDepth++;
      if (char === ')') parenthesesDepth--;
    }
    
    // 只在顶层查找操作符
    if (!inQuotes && parenthesesDepth === 0) {
      // 检查是否匹配操作符
      if (upperQuery.substring(i, i + upperOperator.length) === upperOperator) {
        // 确保操作符前后有空格或是字符串边界
        const before = i === 0 || /\s/.test(query[i - 1]);
        const after = i + upperOperator.length === query.length || /\s/.test(query[i + upperOperator.length]);
        
        if (before && after) {
          return i;
        }
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
      const andTerms = ast.children.map(child => {
        const childQuery = buildPlatformQuery(child, options);
        // 如果子查询包含OR，需要加括号
        if (child.type === 'or') {
          return `(${childQuery})`;
        }
        return childQuery;
      });
      return andTerms.join(' AND ');
      
    case 'or':
      if (!ast.children || ast.children.length === 0) return '';
      const orTerms = ast.children.map(child => buildPlatformQuery(child, options));
      return orTerms.join(' OR ');
      
    case 'not':
      if (!ast.children || ast.children.length === 0) return '';
      const notTerm = buildPlatformQuery(ast.children[0], options);
      // 如果NOT的内容包含操作符，需要加括号
      if (ast.children[0].type !== 'term') {
        return `NOT (${notTerm})`;
      }
      return `NOT ${notTerm}`;
      
    default:
      return '';
  }
}

/**
 * 验证和清理查询
 */
function validateAndCleanQuery(query: string): string {
  // 移除可能的SQL注入字符
  const cleaned = query
    .replace(/[;]/g, ' ')  // 移除分号
    .replace(/--/g, ' ')   // 移除SQL注释
    .trim();
  
  if (!cleaned) {
    throw new Error('Query cannot be empty after sanitization');
  }
  
  return cleaned;
}

export async function advancedSearch(params: AdvancedSearchInput) {
  // 验证和清理查询
  const cleanedQuery = validateAndCleanQuery(params.query);
  
  logger.info(`Advanced search: ${cleanedQuery}`);
  
  // 解析布尔查询
  const ast = parseBooleanQuery(cleanedQuery);
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
    query: cleanedQuery,
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