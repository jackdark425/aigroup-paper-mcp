import { Logger } from '../../../../core/logger.js';
import { fetchPaper } from '../../../../tools/index.js';

const logger = new Logger('FetchPaperHandler');

export async function handleFetchPaper(args: any) {
  try {
    const paper = await fetchPaper(args);
    
    // 映射返回值到 outputSchema 期望的结构
    const mappedPaper = paper ? {
      id: paper.id || '',
      title: paper.title || '',
      authors: Array.isArray(paper.authors)
        ? paper.authors.map((a: any) => typeof a === 'string' ? a : (a.name || ''))
        : [],
      abstract: paper.abstract || undefined,
      published: paper.publishedDate?.toISOString?.() || paper.publishedDate || undefined,
      source: paper.source || '',
      citations: paper.citationCount || undefined,
      url: paper.urls?.landing || paper.urls?.abstract || undefined
    } : {
      id: '',
      title: '',
      authors: [],
      source: ''
    };
    
    const mappedResult = {
      paper: mappedPaper
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(mappedPaper, null, 2)
        }
      ],
      structuredContent: mappedResult
    };
  } catch (error: any) {
    logger.error(`获取论文失败: ${error.message}`);
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