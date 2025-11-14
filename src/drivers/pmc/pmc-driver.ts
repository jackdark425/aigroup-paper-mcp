import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult, SearchField } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { PmcParser, PmcSummaryResponse } from './pmc-parser.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

/**
 * PMC (PubMed Central) 驱动
 * 使用NCBI E-utilities API访问PMC全文数据库
 * API文档: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */
export class PmcDriver extends BaseDriver {
  readonly source = PlatformSource.PMC;
  readonly name = 'PubMed Central';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.PMC];
  private readonly apiBase = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.PMC, PLATFORM_BASE_URLS[PlatformSource.PMC], config);
  }
  
  /**
   * 搜索PMC文章
   * 使用esearch获取ID列表，然后用esummary获取元数据
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    return this.executeWithRateLimit(async () => {
      const searchQuery = this.buildSearchQuery(query);
      const retstart = query.offset || 0;
      const retmax = query.limit || 10;
      
      this.logger.info(`Searching PMC: ${searchQuery}`);
      
      // 第一步：使用esearch获取ID列表
      const searchParams = new URLSearchParams({
        db: 'pmc',
        term: searchQuery,
        retstart: retstart.toString(),
        retmax: retmax.toString(),
        retmode: 'json',
        sort: this.mapSortField(query.sortBy)
      });
      
      const searchResponse = await this.httpClient.get<any>(
        `${this.apiBase}/esearch.fcgi?${searchParams.toString()}`
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
            sources: { [PlatformSource.PMC]: 0 },
            hasMore: false,
            nextOffset: retstart
          }
        };
      }
      
      // 第二步：使用esummary获取文章摘要信息（JSON格式，更容易解析）
      const summaryParams = new URLSearchParams({
        db: 'pmc',
        id: idList.join(','),
        retmode: 'json',
        rettype: 'abstract'
      });
      
      const summaryResponse = await this.httpClient.get<PmcSummaryResponse>(
        `${this.apiBase}/esummary.fcgi?${summaryParams.toString()}`
      );
      
      const { entries } = PmcParser.parseSearchResponse(summaryResponse);
      
      return {
        papers: entries,
        total,
        query,
        took: Date.now() - startTime,
        metadata: {
          sources: { [PlatformSource.PMC]: entries.length },
          hasMore: retstart + entries.length < total,
          nextOffset: retstart + entries.length
        }
      };
    });
  }
  
  /**
   * 获取单篇论文的完整信息
   * 使用efetch获取JATS XML格式的完整文章
   */
  async fetchPaper(id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching PMC paper: ${id}`);
      
      const params = new URLSearchParams({
        db: 'pmc',
        id,
        retmode: 'xml'
      });
      
      const response = await this.httpClient.get<string>(
        `${this.apiBase}/efetch.fcgi?${params.toString()}`
      );
      
      return PmcParser.parsePaperResponse(response);
    });
  }
  
  /**
   * 获取指定分类的最新论文
   */
  async fetchLatest(category: string, limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.info(`Fetching latest papers from category: ${category}`);
      
      // 使用esearch获取最新的ID
      const searchParams = new URLSearchParams({
        db: 'pmc',
        term: category,
        retmax: limit.toString(),
        retmode: 'json',
        sort: 'pub_date',
        datetype: 'pdat'
      });
      
      const searchResponse = await this.httpClient.get<any>(
        `${this.apiBase}/esearch.fcgi?${searchParams.toString()}`
      );
      
      const idList = searchResponse.esearchresult?.idlist || [];
      
      if (idList.length === 0) {
        return [];
      }
      
      // 使用esummary获取摘要
      const summaryParams = new URLSearchParams({
        db: 'pmc',
        id: idList.join(','),
        retmode: 'json'
      });
      
      const summaryResponse = await this.httpClient.get<PmcSummaryResponse>(
        `${this.apiBase}/esummary.fcgi?${summaryParams.toString()}`
      );
      
      const { entries } = PmcParser.parseSearchResponse(summaryResponse);
      
      return entries;
    });
  }
  
  /**
   * 列出可用的分类
   * PMC使用MeSH主题词作为分类系统
   */
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'medicine', name: 'Medicine', description: '医学' },
      { id: 'biology', name: 'Biology', description: '生物学' },
      { id: 'biochemistry', name: 'Biochemistry', description: '生物化学' },
      { id: 'genetics', name: 'Genetics', description: '遗传学' },
      { id: 'immunology', name: 'Immunology', description: '免疫学' },
      { id: 'neuroscience', name: 'Neuroscience', description: '神经科学' },
      { id: 'pharmacology', name: 'Pharmacology', description: '药理学' },
      { id: 'public health', name: 'Public Health', description: '公共卫生' },
      { id: 'oncology', name: 'Oncology', description: '肿瘤学' },
      { id: 'cardiology', name: 'Cardiology', description: '心脏病学' }
    ];
  }
  
  /**
   * 构建PMC搜索查询
   * 支持字段搜索和MeSH主题词过滤
   */
  private buildSearchQuery(query: SearchQuery): string {
    const field = query.field || SearchField.ALL;
    const searchTerm = query.query;
    
    let pmcQuery = '';
    
    // 根据搜索字段构建查询
    switch (field) {
      case SearchField.TITLE:
        pmcQuery = `${searchTerm}[Title]`;
        break;
      case SearchField.ABSTRACT:
        pmcQuery = `${searchTerm}[Abstract]`;
        break;
      case SearchField.AUTHOR:
        pmcQuery = `${searchTerm}[Author]`;
        break;
      default:
        pmcQuery = searchTerm;
    }
    
    // 添加分类过滤（使用MeSH术语）
    if (query.categories && query.categories.length > 0) {
      const catQuery = query.categories.map(cat => `${cat}[MeSH Terms]`).join(' OR ');
      pmcQuery = `${pmcQuery} AND (${catQuery})`;
    }
    
    // 添加日期过滤
    if (query.dateRange) {
      const fromDate = query.dateRange.start ? this.formatDate(query.dateRange.start) : '1900/01/01';
      const toDate = query.dateRange.end ? this.formatDate(query.dateRange.end) : '3000/12/31';
      pmcQuery = `${pmcQuery} AND ${fromDate}:${toDate}[PDAT]`;
    }
    
    return pmcQuery;
  }
  
  /**
   * 映射排序字段到PMC API格式
   */
  private mapSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'date':
        return 'pub_date';
      case 'citations':
        return 'PMC Citation Count';
      case 'relevance':
      default:
        return 'relevance';
    }
  }
  
  /**
   * 格式化日期为YYYY/MM/DD格式
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}