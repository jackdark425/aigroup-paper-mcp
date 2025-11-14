import { IDriver, DriverConfig, HealthStatus, Category } from '../../types/driver.js';
import { Paper, PlatformSource } from '../../types/paper.js';
import { SearchQuery, SearchResult } from '../../types/search.js';
import { RateLimiter } from '../../core/rate-limiter.js';
import { Logger } from '../../core/logger.js';
import { HttpClient } from '../../utils/http-client.js';
import { config } from '../../config/index.js';

export abstract class BaseDriver implements IDriver {
  protected logger: Logger;
  protected httpClient: HttpClient;
  protected rateLimiter: RateLimiter;
  
  abstract readonly source: PlatformSource;
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  
  constructor(source: PlatformSource, baseUrl: string, driverConfig?: DriverConfig) {
    this.logger = new Logger(`Driver:${source}`);
    
    const finalConfig = {
      ...config.drivers[source],
      ...driverConfig
    };
    
    this.httpClient = new HttpClient({
      baseUrl: finalConfig.baseUrl || baseUrl,
      timeout: finalConfig.timeout,
      headers: finalConfig.customHeaders,
      maxRetries: finalConfig.maxRetries
    });
    
    this.rateLimiter = new RateLimiter({
      maxTokens: finalConfig.rateLimit?.maxTokens || 10,
      refillRate: finalConfig.rateLimit?.refillRate || 1
    });
  }
  
  abstract search(query: SearchQuery): Promise<SearchResult>;
  abstract fetchPaper(id: string): Promise<Paper>;
  abstract fetchLatest(category: string, limit: number): Promise<Paper[]>;
  abstract listCategories(): Promise<Category[]>;
  
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // 使用一个简单的查询来测试API是否可用
      await this.httpClient.get('/query?search_query=test&max_results=1', { timeout: 5000 });
      
      return {
        healthy: true,
        latency: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        healthy: false,
        message: error.message,
        timestamp: new Date()
      };
    }
  }
  
  protected async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.rateLimiter.acquire();
    return fn();
  }
}