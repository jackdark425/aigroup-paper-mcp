import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { OpenAlexParser, OpenAlexResponse } from './openalex-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class OpenAlexDriver extends BaseDriver {
  readonly source = PlatformSource.OPENALEX;
  readonly name = 'OpenAlex';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.OPENALEX];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.OPENALEX, PLATFORM_BASE_URLS[PlatformSource.OPENALEX], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const params = new URLSearchParams({
        filter: searchQuery,
        page: Math.floor((query.offset || 0) / (query.limit || 10)) + 1 + '',
        per_page: (query.limit || 10).toString(),
        sort: this.mapSortField(query.sortBy, query.sortOrder)
      });
      
      this.logger.info(`Searching OpenAlex: ${searchQuery}`);
      
      const response = await this.httpClient.get<OpenAlexResponse>(`/works?${params.toString()}`);
      const { entries, total } = OpenAlexParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.OPENALEX]: entries.length },
          hasMore: (query.offset || 0) + entries.length < total,
          nextOffset: (query.offset || 0) + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching OpenAlex paper: ${id}`);
      
      // OpenAlex ID格式: W2741809807 或完整URL
      const workId = id.startsWith('W') ? id : `W${id}`;
      const response = await this.httpClient.get<any>(`/works/${workId}`);
      
      return OpenAlexParser.parseWork(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const params = new URLSearchParams({
        filter: `concepts.id:${category}`,
        sort: 'publication_date:desc',
        per_page: limit.toString()
      });
      
      const response = await this.httpClient.get<OpenAlexResponse>(`/works?${params.toString()}`);
      const { entries } = OpenAlexParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    // OpenAlex使用concepts作为分类，这里返回顶级概念
    return [
      { id: 'C41008148', name: 'Computer Science', level: 0 },
      { id: 'C121332964', name: 'Physics', level: 0 },
      { id: 'C185592680', name: 'Chemistry', level: 0 },
      { id: 'C71924100', name: 'Medicine', level: 0 },
      { id: 'C15744967', name: 'Psychology', level: 0 },
      { id: 'C162324750', name: 'Economics', level: 0 },
      { id: 'C144024400', name: 'Sociology', level: 0 },
      { id: 'C86803240', name: 'Biology', level: 0 },
      { id: 'C127413603', name: 'Geography', level: 0 },
      { id: 'C33923547', name: 'Mathematics', level: 0 }
    ];
  }
  
  async fetchTopCited(concept: string, since: Date, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching top cited papers for concept: ${concept}`);
      
      const sinceStr = since.toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        filter: `concepts.id:${concept},from_publication_date:${sinceStr}`,
        sort: 'cited_by_count:desc',
        per_page: limit.toString()
      });
      
      const response = await this.httpClient.get<OpenAlexResponse>(`/works?${params.toString()}`);
      const { entries } = OpenAlexParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let filters: string[] = [];
    
    // 构建搜索过滤器
    switch (field) {
      case SearchField.TITLE:
        filters.push(`display_name.search:${searchTerm}`);
        break;
      case SearchField.ABSTRACT:
        filters.push(`abstract.search:${searchTerm}`);
        break;
      case SearchField.AUTHOR:
        filters.push(`authorships.author.display_name.search:${searchTerm}`);
        break;
      default:
        // OpenAlex的default_search包含标题、摘要等
        filters.push(`default.search:${searchTerm}`);
    }
    
    // 添加分类过滤
    if (query.categories && query.categories.length > 0) {
      const conceptFilters = query.categories.map(cat => `concepts.id:${cat}`).join('|');
      filters.push(conceptFilters);
    }
    
    // 添加日期范围过滤
    if (query.dateRange) {
      if (query.dateRange.start) {
        const startDate = query.dateRange.start.toISOString().split('T')[0];
        filters.push(`from_publication_date:${startDate}`);
      }
      if (query.dateRange.end) {
        const endDate = query.dateRange.end.toISOString().split('T')[0];
        filters.push(`to_publication_date:${endDate}`);
      }
    }
    
    return filters.join(',');
  }
  
  private mapSortField(sortBy?: string, sortOrder?: string): string {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'date':
        return `publication_date:${order}`;
      case 'citations':
        return `cited_by_count:${order}`;
      case 'relevance':
      default:
        return 'relevance_score:desc';
    }
  }
}