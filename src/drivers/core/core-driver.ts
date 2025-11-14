import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { CoreParser, CoreResponse } from './core-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class CoreDriver extends BaseDriver {
  readonly source = PlatformSource.CORE;
  readonly name = 'CORE';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.CORE];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.CORE, PLATFORM_BASE_URLS[PlatformSource.CORE], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      
      this.logger.info(`Searching CORE: ${searchQuery}`);
      
      const response = await this.httpClient.post<CoreResponse>('/search/works', {
        q: searchQuery,
        offset,
        limit,
        stats: true
      });
      
      const { entries, total } = CoreParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.CORE]: entries.length },
          hasMore: offset + entries.length < total,
          nextOffset: offset + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching CORE paper: ${id}`);
      
      const response = await this.httpClient.get<any>(`/works/${id}`);
      return CoreParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const response = await this.httpClient.post<CoreResponse>('/search/works', {
        q: category,
        limit,
        sort: 'publishedDate:desc'
      });
      
      const { entries } = CoreParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'computer science', name: 'Computer Science' },
      { id: 'mathematics', name: 'Mathematics' },
      { id: 'physics', name: 'Physics' },
      { id: 'biology', name: 'Biology' },
      { id: 'medicine', name: 'Medicine' },
      { id: 'engineering', name: 'Engineering' },
      { id: 'chemistry', name: 'Chemistry' },
      { id: 'earth science', name: 'Earth Science' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let coreQuery = '';
    
    switch (field) {
      case SearchField.TITLE:
        coreQuery = `title:${searchTerm}`;
        break;
      case SearchField.ABSTRACT:
        coreQuery = `abstract:${searchTerm}`;
        break;
      case SearchField.AUTHOR:
        coreQuery = `author:${searchTerm}`;
        break;
      default:
        coreQuery = searchTerm;
    }
    
    if (query.categories && query.categories.length > 0) {
      const catQuery = query.categories.map(cat => `topic:"${cat}"`).join(' OR ');
      coreQuery = `${coreQuery} AND (${catQuery})`;
    }
    
    return coreQuery;
  }
}