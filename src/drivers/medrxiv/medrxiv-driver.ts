import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { MedrxivParser } from './medrxiv-parser.js';
import { BiorxivResponse } from '../biorxiv/biorxiv-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class MedrxivDriver extends BaseDriver {
  readonly source = PlatformSource.MEDRXIV;
  readonly name = 'medRxiv';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.MEDRXIV];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.MEDRXIV, PLATFORM_BASE_URLS[PlatformSource.MEDRXIV], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const cursor = query.offset || 0;
      const limit = query.limit || 10;
      
      this.logger.info(`Searching medRxiv: ${searchQuery}`);
      
      const params = new URLSearchParams({
        server: 'medrxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/${searchQuery}/${cursor}/${limit}?${params.toString()}`
      );
      
      const { entries, total } = MedrxivParser.parseSearchResponse(response, this.source);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.MEDRXIV]: entries.length },
          hasMore: cursor + entries.length < total,
          nextOffset: cursor + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching medRxiv paper: ${id}`);
      
      const params = new URLSearchParams({
        server: 'medrxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/medrxiv/${id}?${params.toString()}`
      );
      
      return MedrxivParser.parsePaperResponse(response, this.source);
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
        server: 'medrxiv',
        format: 'json'
      });
      
      const response = await this.httpClient.get<BiorxivResponse>(
        `/details/medrxiv/${startDate}/${endDate}/0/${limit}?${params.toString()}`
      );
      
      const { entries } = MedrxivParser.parseSearchResponse(response, this.source);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'infectious-diseases', name: 'Infectious Diseases' },
      { id: 'epidemiology', name: 'Epidemiology' },
      { id: 'public-health', name: 'Public Health' },
      { id: 'cardiology', name: 'Cardiology' },
      { id: 'oncology', name: 'Oncology' },
      { id: 'radiology', name: 'Radiology' },
      { id: 'psychiatry', name: 'Psychiatry' },
      { id: 'surgery', name: 'Surgery' },
      { id: 'pediatrics', name: 'Pediatrics' },
      { id: 'obstetrics', name: 'Obstetrics and Gynecology' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const today = new Date();
    const lastYear = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const startDate = query.dateRange?.start || lastYear;
    const endDate = query.dateRange?.end || today;
    
    return `${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`;
  }
}