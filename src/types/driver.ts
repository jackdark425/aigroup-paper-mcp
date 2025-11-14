import { Paper, PlatformSource } from './paper.js';
import { SearchQuery, SearchResult } from './search.js';

export interface IDriver {
  readonly source: PlatformSource;
  readonly name: string;
  readonly baseUrl: string;
  
  search(query: SearchQuery): Promise<SearchResult>;
  fetchPaper(id: string): Promise<Paper>;
  fetchLatest(category: string, limit: number): Promise<Paper[]>;
  listCategories(): Promise<Category[]>;
  
  fetchTopCited?(concept: string, since: Date, limit: number): Promise<Paper[]>;
  fetchByDOI?(doi: string): Promise<Paper>;
  
  healthCheck(): Promise<HealthStatus>;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level?: number;
}

export interface HealthStatus {
  healthy: boolean;
  latency?: number;
  message?: string;
  timestamp: Date;
}

export interface DriverConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: RateLimitConfig;
  customHeaders?: Record<string, string>;
}

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
}