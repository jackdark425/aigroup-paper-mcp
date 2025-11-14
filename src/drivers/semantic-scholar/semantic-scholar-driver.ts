import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { SemanticScholarParser, SemanticScholarResponse, SemanticScholarPaper } from './semantic-scholar-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class SemanticScholarDriver extends BaseDriver {
  readonly source = PlatformSource.SEMANTIC_SCHOLAR;
  readonly name = 'Semantic Scholar';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.SEMANTIC_SCHOLAR];
  private apiKey?: string;
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.SEMANTIC_SCHOLAR, PLATFORM_BASE_URLS[PlatformSource.SEMANTIC_SCHOLAR], config);
    // 支持通过环境变量配置API密钥
    this.apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || config?.apiKey;
    
    if (this.apiKey) {
      this.logger.info('Using Semantic Scholar API key for enhanced rate limits');
    } else {
      this.logger.warn('No API key configured - using public rate limits (1 req/sec)');
    }
  }
  
  /**
   * 获取请求头，如果有API密钥则添加
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      
      this.logger.info(`Searching Semantic Scholar: ${searchQuery}`);
      
      const params = new URLSearchParams({
        query: searchQuery,
        offset: offset.toString(),
        limit: limit.toString(),
        fields: 'paperId,externalIds,title,abstract,authors,year,venue,publicationDate,citationCount,referenceCount,influentialCitationCount,fieldsOfStudy,openAccessPdf,isOpenAccess'
      });
      
      const response = await this.httpClient.get<SemanticScholarResponse>(
        `/paper/search?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      const { entries, total } = SemanticScholarParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.SEMANTIC_SCHOLAR]: entries.length },
          hasMore: offset + entries.length < total,
          nextOffset: offset + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching Semantic Scholar paper: ${id}`);
      
      const params = new URLSearchParams({
        fields: 'paperId,externalIds,title,abstract,authors,year,venue,publicationDate,citationCount,referenceCount,influentialCitationCount,fieldsOfStudy,openAccessPdf,isOpenAccess'
      });
      
      const response = await this.httpClient.get<SemanticScholarPaper>(
        `/paper/${id}?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return SemanticScholarParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const params = new URLSearchParams({
        query: category,
        limit: limit.toString(),
        fields: 'paperId,externalIds,title,abstract,authors,year,venue,publicationDate,citationCount,referenceCount,influentialCitationCount,fieldsOfStudy,openAccessPdf,isOpenAccess',
        sort: 'publicationDate:desc'
      });
      
      const response = await this.httpClient.get<SemanticScholarResponse>(
        `/paper/search?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      
      const { entries } = SemanticScholarParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'Computer Science', name: 'Computer Science' },
      { id: 'Medicine', name: 'Medicine' },
      { id: 'Biology', name: 'Biology' },
      { id: 'Physics', name: 'Physics' },
      { id: 'Chemistry', name: 'Chemistry' },
      { id: 'Mathematics', name: 'Mathematics' },
      { id: 'Engineering', name: 'Engineering' },
      { id: 'Materials Science', name: 'Materials Science' },
      { id: 'Psychology', name: 'Psychology' },
      { id: 'Economics', name: 'Economics' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    // Semantic Scholar supports simple query strings
    // Field-specific searches are handled by the API
    return query.query;
  }
}