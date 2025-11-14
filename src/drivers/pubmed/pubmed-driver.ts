import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { PubmedParser } from './pubmed-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

export class PubmedDriver extends BaseDriver {
  readonly source = PlatformSource.PUBMED;
  readonly name = 'PubMed';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.PUBMED];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.PUBMED, PLATFORM_BASE_URLS[PlatformSource.PUBMED], config);
  }
  
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const retstart = query.offset || 0;
      const retmax = query.limit || 10;
      
      this.logger.info(`Searching PubMed: ${searchQuery}`);
      
      // 首先执行搜索获取ID列表
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: searchQuery,
        retstart: retstart.toString(),
        retmax: retmax.toString(),
        retmode: 'json',
        sort: this.mapSortField(query.sortBy)
      });
      
      const searchResponse = await this.httpClient.get<any>(
        `/esearch.fcgi?${searchParams.toString()}`
      );
      
      const idList = searchResponse.esearchresult?.idlist || [];
      const total = parseInt(searchResponse.esearchresult?.count || '0', 10);
      
      if (idList.length === 0) {
        return {
          papers: [],
          total: 0,
          query,
          took: Date.now() - startTime,
          metadata: {
            sources: { [PlatformSource.PUBMED]: 0 },
            hasMore: false,
            nextOffset: retstart
          }
        };
      }
      
      // 获取详细信息
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'xml'
      });
      
      const fetchResponse = await this.httpClient.get<string>(
        `/efetch.fcgi?${fetchParams.toString()}`
      );
      
      const { entries } = PubmedParser.parseSearchResponse(fetchResponse);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.PUBMED]: entries.length },
          hasMore: retstart + entries.length < total,
          nextOffset: retstart + entries.length
        }
      };
    });
  }
  
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching PubMed paper: ${id}`);
      
      const params = new URLSearchParams({
        db: 'pubmed',
        id,
        retmode: 'xml'
      });
      
      const response = await this.httpClient.get<string>(
        `/efetch.fcgi?${params.toString()}`
      );
      
      return PubmedParser.parsePaperResponse(response);
    });
  }
  
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: category,
        retmax: limit.toString(),
        retmode: 'json',
        sort: 'pub_date',
        datetype: 'pdat'
      });
      
      const searchResponse = await this.httpClient.get<any>(
        `/esearch.fcgi?${searchParams.toString()}`
      );
      
      const idList = searchResponse.esearchresult?.idlist || [];
      
      if (idList.length === 0) {
        return [];
      }
      
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'xml'
      });
      
      const fetchResponse = await this.httpClient.get<string>(
        `/efetch.fcgi?${fetchParams.toString()}`
      );
      
      const { entries } = PubmedParser.parseSearchResponse(fetchResponse);
      
      return entries;
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'medicine', name: 'Medicine' },
      { id: 'biology', name: 'Biology' },
      { id: 'genetics', name: 'Genetics' },
      { id: 'pharmacology', name: 'Pharmacology' },
      { id: 'immunology', name: 'Immunology' },
      { id: 'neuroscience', name: 'Neuroscience' },
      { id: 'oncology', name: 'Oncology' },
      { id: 'cardiology', name: 'Cardiology' }
    ];
  }
  
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let pubmedQuery = '';
    
    switch (field) {
      case SearchField.TITLE:
        pubmedQuery = `${searchTerm}[Title]`;
        break;
      case SearchField.ABSTRACT:
        pubmedQuery = `${searchTerm}[Abstract]`;
        break;
      case SearchField.AUTHOR:
        pubmedQuery = `${searchTerm}[Author]`;
        break;
      default:
        pubmedQuery = searchTerm;
    }
    
    if (query.categories && query.categories.length > 0) {
      const catQuery = query.categories.map(cat => `${cat}[MeSH Terms]`).join(' OR ');
      pubmedQuery = `${pubmedQuery} AND (${catQuery})`;
    }
    
    return pubmedQuery;
  }
  
  private mapSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'pub_date';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
}