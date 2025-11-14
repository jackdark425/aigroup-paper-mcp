import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  display_name?: string;
  publication_date?: string;
  authorships?: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions?: Array<{
      display_name: string;
    }>;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: Array<{
    id: string;
    display_name: string;
    level: number;
  }>;
  cited_by_count?: number;
  referenced_works_count?: number;
  primary_location?: {
    source?: {
      display_name: string;
    };
    landing_page_url?: string;
    pdf_url?: string;
  };
  open_access?: {
    is_oa: boolean;
    oa_url?: string;
  };
  language?: string;
  updated_date?: string;
}

export interface OpenAlexResponse {
  results: OpenAlexWork[];
  meta: {
    count: number;
    page: number;
    per_page: number;
  };
}

export class OpenAlexParser {
  /**
   * 解析OpenAlex搜索响应
   */
  static parseSearchResponse(response: OpenAlexResponse): { entries: Paper[]; total: number } {
    const entries = response.results.map(work => this.parseWork(work));
    return {
      entries,
      total: response.meta.count
    };
  }
  
  /**
   * 解析单个OpenAlex作品
   */
  static parseWork(work: OpenAlexWork): Paper {
    const id = work.id.split('/').pop() || work.id;
    const title = work.display_name || work.title || 'Untitled';
    
    // 解析作者
    const authors: Author[] = (work.authorships || []).map(authorship => ({
      name: authorship.author.display_name,
      affiliations: authorship.institutions?.map(inst => inst.display_name),
      orcid: authorship.author.orcid
    }));
    
    // 解析摘要（从倒排索引重建）
    const abstract = this.reconstructAbstract(work.abstract_inverted_index);
    
    // 解析分类/概念
    const categories = (work.concepts || [])
      .filter(c => c.level === 0 || c.level === 1) // 只取顶级和二级概念
      .map(c => c.display_name);
    
    // 解析URL
    const pdfUrl = work.primary_location?.pdf_url || work.open_access?.oa_url;
    const landingUrl = work.primary_location?.landing_page_url;
    
    return {
      id,
      source: PlatformSource.OPENALEX,
      doi: work.doi,
      title,
      authors,
      abstract,
      keywords: [],
      publishedDate: work.publication_date ? new Date(work.publication_date) : new Date(),
      updatedDate: work.updated_date ? new Date(work.updated_date) : undefined,
      journal: work.primary_location?.source?.display_name,
      categories,
      citationCount: work.cited_by_count,
      referenceCount: work.referenced_works_count,
      urls: {
        abstract: landingUrl,
        pdf: pdfUrl,
        landing: landingUrl,
        source: landingUrl
      },
      fullTextAvailable: !!pdfUrl,
      language: work.language,
      metadata: {
        openAccess: work.open_access?.is_oa || false,
        concepts: work.concepts
      }
    };
  }
  
  /**
   * 从倒排索引重建摘要文本
   */
  private static reconstructAbstract(invertedIndex?: Record<string, number[]>): string | undefined {
    if (!invertedIndex) return undefined;
    
    try {
      // 创建一个数组来存储位置和单词的映射
      const words: Array<{ position: number; word: string }> = [];
      
      for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const position of positions) {
          words.push({ position, word });
        }
      }
      
      // 按位置排序并重建文本
      words.sort((a, b) => a.position - b.position);
      return words.map(w => w.word).join(' ');
    } catch (error) {
      return undefined;
    }
  }
}