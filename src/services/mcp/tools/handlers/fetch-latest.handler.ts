import { Logger } from '../../../../core/logger.js';
import { fetchLatest } from '../../../../tools/index.js';

const logger = new Logger('FetchLatestHandler');

export async function handleFetchLatest(args: any) {
  try {
    const toolArgs = {
      source: args.source,
      category: args.category,
      limit: args.limit || 10,
      useCache: args.useCache ?? true,
      summaryOnly: args.summaryOnly ?? false,
      enableEnhancement: args.enableEnhancement ?? true,
      saveToFile: false
    };
    
    const result = await fetchLatest(toolArgs);
    
    // 映射返回值到 outputSchema 期望的结构
    // 处理可能的不同返回类型（包括缓存返回）
    const papers = (result as any).papers || [];
    const count = (result as any).count || (result as any).total || 0;
    const category = (result as any).category || args.category;
    
    const mappedResult = {
      papers: papers.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        authors: Array.isArray(paper.authors)
          ? paper.authors.map((a: any) => typeof a === 'string' ? a : a.name)
          : [],
        abstract: paper.abstract || undefined,
        published: paper.publishedDate?.toISOString?.() || paper.publishedDate || undefined,
        source: paper.source
      })),
      total: count,
      category: category
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
    logger.error(`获取最新论文失败: ${error.message}`);
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