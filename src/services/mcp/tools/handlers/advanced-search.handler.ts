import { Logger } from '../../../../core/logger.js';
import { advancedSearch } from '../../../../tools/index.js';

const logger = new Logger('AdvancedSearchHandler');

export async function handleAdvancedSearch(args: any) {
  try {
    const toolArgs = {
      query: args.query,
      sources: args.sources,
      field: args.field,
      fuzzyMatch: args.fuzzyMatch ?? false,
      exactMatch: args.exactMatch ?? false,
      caseSensitive: false,
      limit: args.limit || 10,
      offset: args.offset || 0
    };
    
    const result = await advancedSearch(toolArgs);
    
    // 映射返回值到 outputSchema 期望的结构
    const mappedResult = {
      results: Array.isArray(result.papers) ? result.papers.map((paper: any) => ({
        id: paper.id || '',
        title: paper.title || '',
        authors: Array.isArray(paper.authors)
          ? paper.authors.map((a: any) => typeof a === 'string' ? a : (a.name || ''))
          : [],
        relevance: paper.enhancedMetadata?.impactScore || undefined
      })) : [],
      total: result.total || 0
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: mappedResult
    };
  } catch (error: any) {
    logger.error(`高级搜索失败: ${error.message}`);
    return {
      content: [
        {
          type: 'text' as const,
          text: `错误: ${error.message}`
        }
      ],
      isError: true
    };
  }
}