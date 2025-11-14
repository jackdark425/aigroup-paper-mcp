/**
 * 统一论文元数据模型
 */
export interface Paper {
  [x: string]: unknown;
  id: string;
  source: PlatformSource;
  doi?: string;
  
  title: string;
  authors: Author[];
  abstract?: string;
  keywords?: string[];
  
  publishedDate: Date;
  updatedDate?: Date;
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  
  categories: string[];
  subjects?: string[];
  
  citationCount?: number;
  referenceCount?: number;
  
  urls: PaperUrls;
  fullText?: string;
  fullTextAvailable: boolean;
  
  language?: string;
  license?: string;
  version?: string;
  
  // 新增：增强的元数据字段
  enhancedMetadata?: EnhancedMetadata;
  
  // 新增：引用格式
  citations?: CitationFormats;
  
  metadata: Record<string, any>;
}

export interface Author {
  [x: string]: unknown;
  name: string;
  affiliations?: string[];
  email?: string;
  orcid?: string;
}

export interface PaperUrls {
  [x: string]: unknown;
  abstract?: string;
  pdf?: string;
  html?: string;
  landing?: string;
  source?: string;
}

export enum PlatformSource {
  ARXIV = 'arxiv',
  OPENALEX = 'openalex',
  PMC = 'pmc',
  EUROPEPMC = 'europepmc',
  BIORXIV = 'biorxiv',
  MEDRXIV = 'medrxiv',
  CORE = 'core',
  SEMANTIC_SCHOLAR = 'semantic-scholar',
  CROSSREF = 'crossref',
  PUBMED = 'pubmed',
  GOOGLE_SCHOLAR = 'google-scholar',
  IACR = 'iacr'
}

/**
 * 引用格式类型
 */
export enum CitationFormat {
  BIBTEX = 'bibtex',
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  IEEE = 'ieee',
  HARVARD = 'harvard'
}

/**
 * 引用格式集合
 */
export interface CitationFormats {
  [x: string]: unknown;
  bibtex?: string;
  apa?: string;
  mla?: string;
  chicago?: string;
  ieee?: string;
  harvard?: string;
}

/**
 * 全文访问类型
 */
export enum AccessType {
  OPEN_ACCESS = 'open',
  SUBSCRIPTION = 'subscription',
  FREE = 'free',
  HYBRID = 'hybrid',
  CLOSED = 'closed'
}

/**
 * 全文格式类型
 */
export enum FullTextFormat {
  PDF = 'pdf',
  HTML = 'html',
  XML = 'xml',
  EPUB = 'epub'
}

/**
 * 增强的元数据接口
 */
export interface EnhancedMetadata {
  [x: string]: unknown;
  // 影响力指标
  impactScore?: number;
  influenceLevel?: InfluenceLevel;
  isHighlyCited?: boolean;
  isHotPaper?: boolean;
  
  // 全文可用性详情
  fullTextDetails?: FullTextDetails;
  
  // 发表信息增强
  publicationYear?: number;
  publicationMonth?: number;
  publicationQuarter?: number;
  
  // 作者信息增强
  authorCount?: number;
  hasCorrespondingAuthor?: boolean;
  authorReputationScore?: number;
  
  // 平台权威性
  platformAuthority?: PlatformAuthority;
  
  // 摘要增强
  summary?: PaperSummaryInfo;
  
  // 时间相关指标
  recencyScore?: number;
  citationVelocity?: number;
  
  // 新增：引用趋势数据
  citationTrends?: CitationTrends;
  
  // 新增：学术标识符
  identifiers?: AcademicIdentifiers;
  
  // 新增：数据质量指标
  dataQuality?: DataQualityMetrics;
}

/**
 * 影响力级别
 */
export enum InfluenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * 全文可用性详情（增强版）
 */
export interface FullTextDetails {
  [x: string]: unknown;
  available: boolean;
  url?: string;
  urls?: FullTextUrl[];
  type?: FullTextFormat;
  license?: string;
  accessType?: AccessType;
  verifiedAt?: Date;
  fileSize?: number;
  pageCount?: number;
  downloadable?: boolean;
  version?: string;
}

/**
 * 全文URL详情
 */
export interface FullTextUrl {
  [x: string]: unknown;
  url: string;
  format: FullTextFormat;
  primary: boolean;
  size?: number;
}

/**
 * 引用趋势数据
 */
export interface CitationTrends {
  [x: string]: unknown;
  totalCitations: number;
  citationsPerYear: CitationPerYear[];
  averageCitationsPerYear: number;
  peakYear?: number;
  peakCitations?: number;
  growthRate?: number;
  citationHalfLife?: number;
  recentCitationRate?: number;
}

/**
 * 年度引用数据
 */
export interface CitationPerYear {
  [x: string]: unknown;
  year: number;
  count: number;
  cumulative?: number;
}

/**
 * 学术标识符
 */
export interface AcademicIdentifiers {
  [x: string]: unknown;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  arxivId?: string;
  isbn?: string;
  issn?: string;
  semanticScholarId?: string;
  openAlexId?: string;
  coreid?: string;
}

/**
 * 数据质量指标
 */
export interface DataQualityMetrics {
  [x: string]: unknown;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  overall: number;
  missingFields: string[];
  verifiedFields: string[];
  dataSource: string;
  lastValidated?: Date;
}

/**
 * 平台权威性评分
 */
export interface PlatformAuthority {
  [x: string]: unknown;
  score: number; // 0-100
  level: AuthorityLevel;
  factors: AuthorityFactor[];
}

export enum AuthorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface AuthorityFactor {
  [x: string]: unknown;
  name: string;
  score: number;
  description: string;
}

/**
 * 论文摘要增强信息
 */
export interface PaperSummaryInfo {
  [x: string]: unknown;
  // 自动生成的摘要
  generated?: string;
  
  // 结构化关键点
  keyPoints?: string[];
  
  // 核心贡献
  contributions?: string[];
  
  // 方法论
  methodology?: string;
  
  // 主要结果
  mainResults?: string[];
  
  // 语言
  language?: string;
  
  // 置信度
  confidence?: number;
}

/**
 * 论文摘要类型（用于大数据集）
 */
export interface PaperSummary {
  [x: string]: unknown;
  id: string;
  title: string;
  authors: string[];
  publishedDate: string;
  source: PlatformSource;
  citationCount?: number;
  abstractPreview?: string;
}

/**
 * 并行搜索性能指标（用于结果展示）
 */
export interface ParallelSearchMetricsResult {
  [x: string]: unknown;
  totalDuration: string;
  platformCount: number;
  successfulPlatforms: number;
  failedPlatforms: number;
  averageLatency: string;
  maxLatency: string;
  minLatency: string;
  totalPapers: number;
  uniquePapers: number;
  duplicatePapers: number;
  parallelEfficiency: string;
  platformMetrics: Array<{
    source: PlatformSource;
    success: boolean;
    latency: string;
    paperCount: number;
    error?: string;
  }>;
}

/**
 * 增强的搜索结果
 */
export interface EnhancedSearchResult {
  [x: string]: unknown;
  papers: Paper[];
  total: number;
  totalBySource: Record<string, number>;
  query: string;
  warnings?: string[];
  
  // 增强的统计信息
  enhancedStats?: EnhancedStats;
  
  // 高影响力论文
  highImpactPapers?: Paper[];
  
  // 智能建议
  suggestions?: {
    processedQuery: string;
    recommendedSources: PlatformSource[];
    queryCorrections: Array<{
      type: string;
      original: string;
      suggested: string;
      reason: string;
    }>;
    parameterSuggestions: Array<{
      parameter: string;
      suggestedValue: any;
      reason: string;
    }>;
    confidence: number;
  };
  
  // 搜索策略信息
  searchStrategy?: {
    selectedPlatforms: PlatformSource[];
    selectionReasons: string[];
    confidence: number;
    parallelStrategy: string;
    fallbackPlatforms?: PlatformSource[];
    healthStatus: Array<{
      source: PlatformSource;
      isHealthy: boolean;
      successRate: number;
      averageLatency: number;
    }>;
  };
  
  // 并行搜索性能指标
  parallelMetrics?: ParallelSearchMetricsResult;
}

/**
 * 增强的统计信息
 */
export interface EnhancedStats {
  [x: string]: unknown;
  // 引用统计
  citationStats: {
    totalCitations: number;
    averageCitations: number;
    maxCitations: number;
    citationDistribution: CitationDistribution[];
  };
  
  // 时间统计
  timeStats: {
    oldestPaper: Date;
    newestPaper: Date;
    publicationYears: number[];
  };
  
  // 平台统计
  platformStats: {
    [source in PlatformSource]?: {
      count: number;
      averageCitations: number;
      fullTextAvailable: number;
    };
  };
  
  // 影响力统计
  impactStats: {
    highImpactCount: number;
    mediumImpactCount: number;
    lowImpactCount: number;
    averageImpactScore: number;
  };
}

/**
 * 引用分布
 */
export interface CitationDistribution {
  [x: string]: unknown;
  range: string;
  count: number;
  percentage: number;
}