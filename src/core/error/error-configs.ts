/**
 * 错误处理配置模块
 */

import { ErrorCategory, RetryConfig, FallbackConfig } from '../../types/error.js';
import { PlatformSource } from '../../types/paper.js';

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  useJitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableCategories: [
    ErrorCategory.NETWORK_TIMEOUT,
    ErrorCategory.NETWORK_CONNECTION,
    ErrorCategory.API_RATE_LIMIT,
    ErrorCategory.API_SERVER_ERROR
  ]
};

/**
 * 默认降级配置
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  platformFallbacks: {
    [PlatformSource.ARXIV]: [PlatformSource.OPENALEX, PlatformSource.SEMANTIC_SCHOLAR],
    [PlatformSource.PUBMED]: [PlatformSource.PMC, PlatformSource.EUROPEPMC],
    [PlatformSource.BIORXIV]: [PlatformSource.MEDRXIV, PlatformSource.PMC],
    [PlatformSource.MEDRXIV]: [PlatformSource.BIORXIV, PlatformSource.PUBMED],
    [PlatformSource.OPENALEX]: [PlatformSource.SEMANTIC_SCHOLAR, PlatformSource.CROSSREF],
    [PlatformSource.SEMANTIC_SCHOLAR]: [PlatformSource.OPENALEX, PlatformSource.CROSSREF],
    [PlatformSource.CORE]: [PlatformSource.OPENALEX, PlatformSource.CROSSREF],
    [PlatformSource.CROSSREF]: [PlatformSource.OPENALEX, PlatformSource.SEMANTIC_SCHOLAR],
    [PlatformSource.PMC]: [PlatformSource.PUBMED, PlatformSource.EUROPEPMC],
    [PlatformSource.EUROPEPMC]: [PlatformSource.PUBMED, PlatformSource.PMC],
    [PlatformSource.GOOGLE_SCHOLAR]: [PlatformSource.SEMANTIC_SCHOLAR, PlatformSource.OPENALEX],
    [PlatformSource.IACR]: [PlatformSource.ARXIV]
  },
  queryFallbacks: {
    simplifyQuery: true,
    expandScope: true,
    useSynonyms: true
  },
  parameterFallbacks: {
    limit: 10,
    offset: 0
  }
};