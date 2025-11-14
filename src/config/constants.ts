import { PlatformSource } from '../types/paper.js';

export const APP_NAME = 'aigroup-paper-mcp';
export const APP_VERSION = '0.1.0';

export const DEFAULT_CACHE_TTL = 3600; // 1 hour
export const DEFAULT_MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_MAX_RETRIES = 3;

// 缓存相关常量
export const CACHE_STORAGE_TYPE = 'json-file';
export const CACHE_STORAGE_PATH = './cache/data.json';
export const CACHE_NAMESPACE = 'papers';

// 缓存TTL配置（秒）
export const CACHE_TTL = {
  SEARCH_RESULTS: 3600, // 1小时
  PAPER_DETAILS: 86400, // 24小时
  LATEST_PAPERS: 1800, // 30分钟
  CATEGORIES: 604800, // 7天
  TRENDS: 3600 // 1小时
};

export const PLATFORM_NAMES: Record<PlatformSource, string> = {
  [PlatformSource.ARXIV]: 'arXiv',
  [PlatformSource.OPENALEX]: 'OpenAlex',
  [PlatformSource.PMC]: 'PubMed Central',
  [PlatformSource.EUROPEPMC]: 'Europe PMC',
  [PlatformSource.BIORXIV]: 'bioRxiv',
  [PlatformSource.MEDRXIV]: 'medRxiv',
  [PlatformSource.CORE]: 'CORE',
  [PlatformSource.SEMANTIC_SCHOLAR]: 'Semantic Scholar',
  [PlatformSource.CROSSREF]: 'CrossRef',
  [PlatformSource.PUBMED]: 'PubMed',
  [PlatformSource.GOOGLE_SCHOLAR]: 'Google Scholar',
  [PlatformSource.IACR]: 'IACR ePrint Archive'
};

export const PLATFORM_BASE_URLS: Record<PlatformSource, string> = {
  [PlatformSource.ARXIV]: 'https://export.arxiv.org/api',
  [PlatformSource.OPENALEX]: 'https://api.openalex.org',
  [PlatformSource.PMC]: 'https://www.ncbi.nlm.nih.gov/pmc',
  [PlatformSource.EUROPEPMC]: 'https://www.ebi.ac.uk/europepmc/webservices/rest',
  [PlatformSource.BIORXIV]: 'https://api.biorxiv.org',
  [PlatformSource.MEDRXIV]: 'https://api.medrxiv.org',
  [PlatformSource.CORE]: 'https://api.core.ac.uk/v3',
  [PlatformSource.SEMANTIC_SCHOLAR]: 'https://api.semanticscholar.org/graph/v1',
  [PlatformSource.CROSSREF]: 'https://api.crossref.org',
  [PlatformSource.PUBMED]: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  [PlatformSource.GOOGLE_SCHOLAR]: 'https://scholar.google.com',
  [PlatformSource.IACR]: 'https://eprint.iacr.org'
};