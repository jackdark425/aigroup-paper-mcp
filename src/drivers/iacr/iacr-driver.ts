import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { IacrParser } from './iacr-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class IacrDriver extends BaseDriver {
  readonly source = PlatformSource.IACR;
  readonly name = 'IACR ePrint Archive';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.IACR];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.IACR, PLATFORM_BASE_URLS[PlatformSource.IACR], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      
      this.logger.info(`Searching IACR: ${searchQuery}`);
      
      // IACR使用简单的搜索页面
      const params = new URLSearchParams({
        q: searchQuery
      });
      
      const response = await this.httpClient.get<string>(
        `/search?${params.toString()}`
      );
      
      const { entries, total } = IacrParser.parseSearchResponse(response);
      
      // 应用分页
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const paginatedEntries = entries.slice(offset, offset + limit);
      
      return {
        papers: paginatedEntries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.IACR]: paginatedEntries.length },
          hasMore: offset + paginatedEntries.length < total,
          nextOffset: offset + paginatedEntries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching IACR paper: ${id}`);
      
      const response = await this.httpClient.get<string>(`/${id}`);
      return IacrParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const currentYear = new Date().getFullYear();
      const response = await this.httpClient.get<string>(`/${currentYear}`);
      
      const { entries } = IacrParser.parseSearchResponse(response);
      
      return entries.slice(0, limit);
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'cryptography', name: 'Cryptography' },
      { id: 'public-key', name: 'Public-Key Cryptography' },
      { id: 'symmetric-key', name: 'Symmetric-Key Cryptography' },
      { id: 'protocols', name: 'Cryptographic Protocols' },
      { id: 'implementation', name: 'Implementation' },
      { id: 'foundations', name: 'Foundations' },
      { id: 'applications', name: 'Applications' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    // IACR使用简单的全文搜索
    return query.query;
  }
}