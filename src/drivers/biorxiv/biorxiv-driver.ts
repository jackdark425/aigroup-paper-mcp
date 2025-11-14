import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { BiorxivParser, BiorxivResponse } from './biorxiv-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class BiorxivDriver extends BaseDriver {
  readonly source = PlatformSource.BIORXIV;
  readonly name = 'bioRxiv';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.BIORXIV];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.BIORXIV, PLATFORM_BASE_URLS[PlatformSource.BIORXIV], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const cursor = query.offset || 0;
      const limit = query.limit || 10;
      
      this.logger.info(`Searching bioRxiv: ${searchQuery}`);
      
      // bioRxiv API uses date range for search
      const params = new URLSearchParams({
        server: 'biorxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/${searchQuery}/${cursor}/${limit}?${params.toString()}`
      );
      
      const { entries, total } = BiorxivParser.parseSearchResponse(response, this.source);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.BIORXIV]: entries.length },
          hasMore: cursor + entries.length < total,
          nextOffset: cursor + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching bioRxiv paper: ${id}`);
      
      const params = new URLSearchParams({
        server: 'biorxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/biorxiv/${id}?${params.toString()}`
      );
      
      return BiorxivParser.parsePaperResponse(response, this.source);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const startDate = lastWeek.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        server: 'biorxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/biorxiv/${startDate}/${endDate}/0/${limit}?${params.toString()}`
      );
      
      const { entries } = BiorxivParser.parseSearchResponse(response, this.source);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'neuroscience', name: 'Neuroscience' },
      { id: 'bioinformatics', name: 'Bioinformatics' },
      { id: 'genomics', name: 'Genomics' },
      { id: 'immunology', name: 'Immunology' },
      { id: 'microbiology', name: 'Microbiology' },
      { id: 'molecular-biology', name: 'Molecular Biology' },
      { id: 'cell-biology', name: 'Cell Biology' },
      { id: 'biochemistry', name: 'Biochemistry' },
      { id: 'genetics', name: 'Genetics' },
      { id: 'evolutionary-biology', name: 'Evolutionary Biology' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    // bioRxiv主要使用日期范围搜索，这里返回默认的日期范围
    const today = new Date();
    const lastYear = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const startDate = query.dateRange?.start || lastYear;
    const endDate = query.dateRange?.end || today;
    
    return `${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`;
  }
}