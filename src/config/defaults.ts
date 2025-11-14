import { AppConfig } from '../types/config.js';
import { PlatformSource } from '../types/paper.js';
import { 
  APP_NAME, 
  APP_VERSION, 
  DEFAULT_CACHE_TTL, 
  DEFAULT_MAX_CACHE_SIZE,
  CACHE_STORAGE_TYPE,
  CACHE_STORAGE_PATH,
  CACHE_NAMESPACE
} from './constants.js';

export const defaultConfig: AppConfig = {
  server: {
    name: APP_NAME,
    version: APP_VERSION,
    environment: 'development'
  },
  drivers: {
    [PlatformSource.ARXIV]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 10,
        refillRate: 1
      }
    },
    [PlatformSource.OPENALEX]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 10,
        refillRate: 1
      }
    },
    [PlatformSource.PMC]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 3,  // NCBI E-utilities允许3请求/秒（无API密钥）
        refillRate: 1  // 每秒补充1个令牌
      }
    },
    [PlatformSource.SEMANTIC_SCHOLAR]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        // 无API密钥：1请求/秒，有API密钥：10-100请求/秒
        // 通过环境变量SEMANTIC_SCHOLAR_API_KEY配置
        maxTokens: process.env.SEMANTIC_SCHOLAR_API_KEY ? 10 : 1,
        refillRate: 1
      }
    },
    [PlatformSource.BIORXIV]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 3,  // bioRxiv公开API，建议保守速率：3请求/秒
        refillRate: 1  // 每秒补充1个令牌
      }
    },
    [PlatformSource.MEDRXIV]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 3,  // medRxiv公开API，建议保守速率：3请求/秒
        refillRate: 1  // 每秒补充1个令牌
      }
    },
    [PlatformSource.EUROPEPMC]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxTokens: 3,  // Europe PMC公开API，建议保守速率：3请求/秒
        refillRate: 1  // 每秒补充1个令牌
      }
    },
    [PlatformSource.PUBMED]: {
      enabled: true,
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        // NCBI E-utilities：无API密钥3请求/秒，有API密钥10请求/秒
        // 通过环境变量NCBI_API_KEY配置
        maxTokens: process.env.NCBI_API_KEY ? 10 : 3,
        refillRate: 1  // 每秒补充1个令牌
      }
    }
  },
  cache: {
    enabled: true,
    ttl: DEFAULT_CACHE_TTL,
    maxSize: DEFAULT_MAX_CACHE_SIZE,
    storage: {
      type: CACHE_STORAGE_TYPE,
      path: CACHE_STORAGE_PATH,
      namespace: CACHE_NAMESPACE,
      defaultTtl: DEFAULT_CACHE_TTL,
      maxSize: DEFAULT_MAX_CACHE_SIZE
    }
  },
  logging: {
    level: 'info',
    format: 'simple',
    destination: 'console'
  },
  searchStrategy: {
    prioritizeOpenAccess: true,
    maxParallelRequests: 3,
    enableIncrementalResults: false,
    preferredResponseTime: 2000,
    minSuccessRate: 0.7,
    enableHealthMonitoring: true,
    healthCheckInterval: 60000
  }
};