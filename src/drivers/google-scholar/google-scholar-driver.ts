import { BaseDriver } from '../base/base-driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { Category, DriverConfig } from '../../types/driver.js';
import { PLATFORM_BASE_URLS } from '../../config/constants.js';

/**
 * Google Scholar驱动
 * 注意：Google Scholar没有官方API，此驱动提供基本框架
 * 实际使用需要配置第三方服务（如SerpAPI）或实现网页抓取
 */
export class GoogleScholarDriver extends BaseDriver {
  readonly source = PlatformSource.GOOGLE_SCHOLAR;
  readonly name = 'Google Scholar';
  readonly baseUrl = PLATFORM_BASE_URLS[PlatformSource.GOOGLE_SCHOLAR];
  
  constructor(config?: DriverConfig) {
    super(PlatformSource.GOOGLE_SCHOLAR, PLATFORM_BASE_URLS[PlatformSource.GOOGLE_SCHOLAR], config);
  }
  
  async search(_query: SearchQuery): Promise<SearchResult> {
    return this.executeWithRateLimit(async () => {
      this.logger.warn('Google Scholar search requires third-party service or web scraping');
      
      // 这里需要实现通过第三方API或网页抓取来获取结果
      // 例如：SerpAPI, ScraperAPI等
      
      throw new Error(
        'Google Scholar driver requires configuration. ' +
        'Please use a third-party service like SerpAPI or implement web scraping.'
      );
    });
  }
  
  async fetchPaper(_id: string): Promise<Paper> {
    return this.executeWithRateLimit(async () => {
      this.logger.warn('Google Scholar fetch requires third-party service or web scraping');
      
      throw new Error(
        'Google Scholar driver requires configuration. ' +
        'Please use a third-party service like SerpAPI or implement web scraping.'
      );
    });
  }
  
  async fetchLatest(_category: string, _limit: number): Promise<Paper[]> {
    return this.executeWithRateLimit(async () => {
      this.logger.warn('Google Scholar latest requires third-party service or web scraping');
      
      throw new Error(
        'Google Scholar driver requires configuration. ' +
        'Please use a third-party service like SerpAPI or implement web scraping.'
      );
    });
  }
  
  async listCategories(): Promise<Category[]> {
    return [
      { id: 'computer_science', name: 'Computer Science' },
      { id: 'medicine', name: 'Medicine' },
      { id: 'biology', name: 'Biology' },
      { id: 'physics', name: 'Physics' },
      { id: 'chemistry', name: 'Chemistry' },
      { id: 'mathematics', name: 'Mathematics' },
      { id: 'engineering', name: 'Engineering' },
      { id: 'social_sciences', name: 'Social Sciences' }
    ];
  }
}