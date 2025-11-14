import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { EuropePmcParser, EuropePmcResponse } from './europepmc-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class EuropePmcDriver extends BaseDriver {
  readonly source = PlatformSource.EUROPEPMC;
  readonly name = 'Europe PMC';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.EUROPEPMC];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.EUROPEPMC, PLATFORM_BASE_URLS[PlatformSource.EUROPEPMC], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const params = new URLSearchParams({
        query: searchQuery,
        pageSize: (query.limit || 10).toString(),
        cursorMark: (query.offset || 0).toString(),
        format: 'json',
        sort: this.mapSortField(query.sortBy)
      });
      
      this.logger.info(`Searching Europe PMC: ${searchQuery}`);
      
      const response = await this.httpClient.get<EuropePmcResponse>(`/search?${params.toString()}`);
      const { entries, total } = EuropePmcParser.parseSearchResponse(response);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.EUROPEPMC]: entries.length },
          hasMore: (query.offset || 0) + entries.length < total,
          nextOffset: (query.offset || 0) + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching Europe PMC paper: ${id}`);
      
      const params = new URLSearchParams({
        query: `ext_id:${id}`,
        format: 'json'
      });
      
      const response = await this.httpClient.get<any>(`/search?${params.toString()}`);
      return EuropePmcParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const params = new URLSearchParams({
        query: category,
        pageSize: limit.toString(),
        sort: 'P_PDATE_D desc',
        format: 'json'
      });
      
      const response = await this.httpClient.get<EuropePmcResponse>(`/search?${params.toString()}`);
      const { entries } = EuropePmcParser.parseSearchResponse(response);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'MED', name: 'Medicine' },
      { id: 'BIO', name: 'Biology' },
      { id: 'AGR', name: 'Agriculture' },
      { id: 'ETH', name: 'Ethics' },
      { id: 'HIS', name: 'History' },
      { id: 'PAT', name: 'Patents' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let europePmcQuery = '';
    
    switch (field) {
      case SearchField.TITLE:
        europePmcQuery = `TITLE:"${searchTerm}"`;
        break;
      case SearchField.ABSTRACT:
        europePmcQuery = `ABSTRACT:"${searchTerm}"`;
        break;
      case SearchField.AUTHOR:
        europePmcQuery = `AUTH:"${searchTerm}"`;
        break;
      default:
        europePmcQuery = searchTerm;
    }
    
    if (query.categories && query.categories.length > 0) {
      const catQuery = query.categories.map(cat => `SRC:${cat}`).join(' OR ');
      europePmcQuery = `${europePmcQuery} AND (${catQuery})`;
    }
    
    return europePmcQuery;
  }
  
  private mapSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'P_PDATE_D desc';
      case 'citations':
        return 'CITED desc';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
}