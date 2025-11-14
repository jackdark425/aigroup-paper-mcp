import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { CrossrefParser, CrossrefResponse } from './crossref-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class CrossrefDriver extends BaseDriver {
  readonly source = PlatformSource.CROSSREF;
  readonly name = 'CrossRef';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.CROSSREF];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.CROSSREF, PLATFORM_BASE_URLS[PlatformSource.CROSSREF], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      
      this.logger.info(`Searching CrossRef: ${searchQuery}`);
      
      const params = new URLSearchParams({
        query: searchQuery,
        offset: offset.toString(),
        rows: limit.toString(),
        sort: this.mapSortField(query.sortBy)
      });
      
      const response = await this.httpClient.get<CrossrefResponse>(
        `/works?${params.toString()}`
      );
      
      const { entries, total } = CrossrefParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.CROSSREF]: entries.length },
          hasMore: offset + entries.length < total,
          nextOffset: offset + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching CrossRef paper: ${id}`);
      
      const response = await this.httpClient.get<any>(`/works/${id}`);
      return CrossrefParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const params = new URLSearchParams({
        filter: `type:${category}`,
        rows: limit.toString(),
        sort: 'published:desc'
      });
      
      const response = await this.httpClient.get<CrossrefResponse>(
        `/works?${params.toString()}`
      );
      
      const { entries } = CrossrefParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'journal-article', name: 'Journal Article' },
      { id: 'book-chapter', name: 'Book Chapter' },
      { id: 'proceedings-article', name: 'Proceedings Article' },
      { id: 'monograph', name: 'Monograph' },
      { id: 'report', name: 'Report' },
      { id: 'book', name: 'Book' },
      { id: 'dataset', name: 'Dataset' },
      { id: 'reference-entry', name: 'Reference Entry' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let crossrefQuery = '';
    
    switch (field) {
      case SearchField.TITLE:
        crossrefQuery = `title:${searchTerm}`;
        break;
      case SearchField.AUTHOR:
        crossrefQuery = `author:${searchTerm}`;
        break;
      default:
        crossrefQuery = searchTerm;
    }
    
    return crossrefQuery;
  }
  
  private mapSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'published';
      case 'citations':
        return 'is-referenced-by-count';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
}