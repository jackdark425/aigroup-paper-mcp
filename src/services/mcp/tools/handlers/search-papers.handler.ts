import { Logger } from '../../../../core/logger.js';
import { searchPapers } from '../../../../tools/index.js';

const logger = new Logger('SearchPapersHandler');

export async function handleSearchPapers(args: any) {
  try {
    const toolArgs = {
      query: args.query,
      sources: args.sources,
      field: args.field,
      categories: args.categories,
      sortBy: args.sortBy,
      sortOrder: args.sortOrder,
      limit: args.limit || 10,
      offset: args.offset || 0,
      enableSmartSuggestions: true,
      enableEnhancement: true,
      enableSearchStrategy: true
    };
    
    const result = await searchPapers(toolArgs);
    
    // 映射返回值到 outputSchema 期望的结构
    const mappedResult = {
      results: result.papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors.map(a => a.name),
        abstract: paper.abstract || undefined,
        published: paper.publishedDate?.toISOString() || undefined,
        source: paper.source,
        citations: paper.citationCount || undefined,
        url: paper.urls?.landing || paper.urls?.abstract || undefined
      })),
      total: result.total,
      sources: Object.keys(result.totalBySource)
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
    logger.error(`搜索论文失败: ${error.message}`);
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