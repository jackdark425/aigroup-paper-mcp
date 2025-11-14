import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { ArxivParser } from './arxiv-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class ArxivDriver extends BaseDriver {
  readonly source = PlatformSource.ARXIV;
  readonly name = 'arXiv';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.ARXIV];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.ARXIV, PLATFORM_BASE_URLS[PlatformSource.ARXIV], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const params = new URLSearchParams({
        search_query: searchQuery,
        start: (query.offset || 0).toString(),
        max_results: (query.limit || 10).toString(),
        sortBy: this.mapSortField(query.sortBy),
        sortOrder: query.sortOrder === 'asc' ? 'ascending' : 'descending'
      });
      
      this.logger.info(`Searching arXiv: ${searchQuery}`);
      
      const response = await this.httpClient.get<string>(`/query?${params.toString()}`);
      const { entries, total } = ArxivParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.ARXIV]: entries.length },
          hasMore: (query.offset || 0) + entries.length < total,
          nextOffset: (query.offset || 0) + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching arXiv paper: ${id}`);
      
      const response = await this.httpClient.get<string>(`/query?id_list=${id}`);
      return ArxivParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      // arXiv需要使用通配符来匹配主分类下的所有子分类
      const searchQuery = category.includes('.') ? `cat:${category}` : `cat:${category}.*`;
      
      const params = new URLSearchParams({
        search_query: searchQuery,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: limit.toString()
      });
      
      const response = await this.httpClient.get<string>(`/query?${params.toString()}`);
      const { entries } = ArxivParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    // arXiv分类是静态的，这里返回主要分类
    return [
      { id: 'cs', name: 'Computer Science' },
      { id: 'math', name: 'Mathematics' },
      { id: 'physics', name: 'Physics' },
      { id: 'q-bio', name: 'Quantitative Biology' },
      { id: 'q-fin', name: 'Quantitative Finance' },
      { id: 'stat', name: 'Statistics' },
      { id: 'eess', name: 'Electrical Engineering and Systems Science' },
      { id: 'econ', name: 'Economics' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let arxivQuery = '';
    
    switch (field) {
      case SearchField.TITLE:
        arxivQuery = `ti:${searchTerm}`;
        break;
      case SearchField.ABSTRACT:
        arxivQuery = `abs:${searchTerm}`;
        break;
      case SearchField.AUTHOR:
        arxivQuery = `au:${searchTerm}`;
        break;
      default:
        arxivQuery = `all:${searchTerm}`;
    }
    
    if (query.categories && query.categories.length > 0) {
      const catQuery = query.categories.map(cat => `cat:${cat}`).join(' OR ');
      arxivQuery = `${arxivQuery} AND (${catQuery})`;
    }
    
    return arxivQuery;
  }
  
  private mapSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'submittedDate';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
}