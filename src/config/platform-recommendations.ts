import { PlatformSource } from '../types/paper.js';

/**
 * 平台主题分类
 */
export enum PlatformCategory {
  BIOMEDICAL = 'biomedical',
  COMPUTER_SCIENCE = 'computer_science',
  GENERAL_ACADEMIC = 'general_academic',
  PHYSICS_MATH = 'physics_math',
  MULTIDISCIPLINARY = 'multidisciplinary'
}

/**
 * 平台元数据配置
 */
export interface PlatformMetadata {
  source: PlatformSource;
  name: string;
  categories: PlatformCategory[];
  primaryFields: string[];
  strengths: string[];
  limitations: string[];
  successRate: number; // 0-1 成功率
  responseTime: number; // 平均响应时间(ms)
  coverage: string[]; // 覆盖领域
}

/**
 * 平台推荐规则配置
 */
export const PLATFORM_METADATA: Record<PlatformSource, PlatformMetadata> = {
  [PlatformSource.ARXIV]: {
    source: PlatformSource.ARXIV,
    name: 'arXiv',
    categories: [PlatformCategory.COMPUTER_SCIENCE, PlatformCategory.PHYSICS_MATH],
    primaryFields: ['cs', 'math', 'physics', 'stat'],
    strengths: ['预印本快速发布', '计算机科学和数学领域覆盖全面', '开放获取'],
    limitations: ['未经同行评审', '部分领域覆盖有限'],
    successRate: 0.95,
    responseTime: 2000,
    coverage: ['计算机科学', '数学', '物理学', '统计学', '定量生物学', '定量金融']
  },
  [PlatformSource.OPENALEX]: {
    source: PlatformSource.OPENALEX,
    name: 'OpenAlex',
    categories: [PlatformCategory.GENERAL_ACADEMIC, PlatformCategory.MULTIDISCIPLINARY],
    primaryFields: ['all'],
    strengths: ['综合性学术数据库', '引用网络分析', '机构和工作信息'],
    limitations: ['某些专业领域覆盖可能不足'],
    successRate: 0.90,
    responseTime: 1500,
    coverage: ['所有学术领域', '跨学科研究']
  },
  [PlatformSource.PMC]: {
    source: PlatformSource.PMC,
    name: 'PubMed Central',
    categories: [PlatformCategory.BIOMEDICAL],
    primaryFields: ['medicine', 'biology', 'health sciences'],
    strengths: ['生物医学领域权威', '全文开放获取', 'NIH资助研究'],
    limitations: ['主要限于生物医学领域'],
    successRate: 0.92,
    responseTime: 1800,
    coverage: ['医学', '生物学', '健康科学', '生物化学', '遗传学']
  },
  [PlatformSource.EUROPEPMC]: {
    source: PlatformSource.EUROPEPMC,
    name: 'Europe PMC',
    categories: [PlatformCategory.BIOMEDICAL],
    primaryFields: ['life sciences', 'biomedicine'],
    strengths: ['欧洲生物医学研究', '多语言支持', '专利文献'],
    limitations: ['主要限于生命科学'],
    successRate: 0.88,
    responseTime: 2200,
    coverage: ['生命科学', '生物医学', '农业科学', '环境科学']
  },
  [PlatformSource.BIORXIV]: {
    source: PlatformSource.BIORXIV,
    name: 'bioRxiv',
    categories: [PlatformCategory.BIOMEDICAL],
    primaryFields: ['biology', 'life sciences'],
    strengths: ['生物学预印本', '快速发布', '开放获取'],
    limitations: ['未经同行评审', '限于生物学领域'],
    successRate: 0.85,
    responseTime: 2500,
    coverage: ['生物学', '生物化学', '分子生物学', '细胞生物学']
  },
  [PlatformSource.MEDRXIV]: {
    source: PlatformSource.MEDRXIV,
    name: 'medRxiv',
    categories: [PlatformCategory.BIOMEDICAL],
    primaryFields: ['medicine', 'clinical research'],
    strengths: ['医学预印本', '临床研究', '流行病学'],
    limitations: ['未经同行评审', '限于医学领域'],
    successRate: 0.83,
    responseTime: 2600,
    coverage: ['医学', '临床研究', '公共卫生', '流行病学']
  },
  [PlatformSource.CORE]: {
    source: PlatformSource.CORE,
    name: 'CORE',
    categories: [PlatformCategory.GENERAL_ACADEMIC, PlatformCategory.MULTIDISCIPLINARY],
    primaryFields: ['all'],
    strengths: ['大规模开放获取聚合', '全文搜索', '机构知识库'],
    limitations: ['质量参差不齐'],
    successRate: 0.80,
    responseTime: 3000,
    coverage: ['所有学术领域', '开放获取资源']
  },
  [PlatformSource.SEMANTIC_SCHOLAR]: {
    source: PlatformSource.SEMANTIC_SCHOLAR,
    name: 'Semantic Scholar',
    categories: [PlatformCategory.COMPUTER_SCIENCE, PlatformCategory.GENERAL_ACADEMIC],
    primaryFields: ['computer science', 'ai', 'ml'],
    strengths: ['AI驱动的语义搜索', '引用分析', '研究趋势'],
    limitations: ['某些传统领域覆盖有限'],
    successRate: 0.87,
    responseTime: 1700,
    coverage: ['计算机科学', '人工智能', '机器学习', '语义分析']
  },
  [PlatformSource.CROSSREF]: {
    source: PlatformSource.CROSSREF,
    name: 'CrossRef',
    categories: [PlatformCategory.GENERAL_ACADEMIC],
    primaryFields: ['all'],
    strengths: ['DOI注册机构', '跨出版商元数据', '引用链接'],
    limitations: ['某些内容需要订阅'],
    successRate: 0.89,
    responseTime: 1900,
    coverage: ['所有学术领域', '跨出版商内容']
  },
  [PlatformSource.PUBMED]: {
    source: PlatformSource.PUBMED,
    name: 'PubMed',
    categories: [PlatformCategory.BIOMEDICAL],
    primaryFields: ['medicine', 'biomedicine'],
    strengths: ['生物医学权威数据库', 'MEDLINE索引', '临床指南'],
    limitations: ['主要限于生物医学'],
    successRate: 0.91,
    responseTime: 1600,
    coverage: ['医学', '生物医学', '护理学', '牙科学', '兽医学']
  },
  [PlatformSource.GOOGLE_SCHOLAR]: {
    source: PlatformSource.GOOGLE_SCHOLAR,
    name: 'Google Scholar',
    categories: [PlatformCategory.GENERAL_ACADEMIC, PlatformCategory.MULTIDISCIPLINARY],
    primaryFields: ['all'],
    strengths: ['覆盖面最广', '引用计数', '相关研究推荐'],
    limitations: ['质量控制有限', 'API限制严格'],
    successRate: 0.75,
    responseTime: 4000,
    coverage: ['所有学术领域', '灰色文献', '学位论文']
  },
  [PlatformSource.IACR]: {
    source: PlatformSource.IACR,
    name: 'IACR ePrint Archive',
    categories: [PlatformCategory.COMPUTER_SCIENCE],
    primaryFields: ['cryptography', 'security'],
    strengths: ['密码学专业领域', '快速发布', '权威性'],
    limitations: ['限于密码学和信息安全'],
    successRate: 0.94,
    responseTime: 2100,
    coverage: ['密码学', '信息安全', '密码分析', '区块链']
  }
};

/**
 * 主题关键词映射
 */
export const TOPIC_KEYWORDS: Record<string, PlatformCategory[]> = {
  // 生物医学关键词
  'cancer': [PlatformCategory.BIOMEDICAL],
  'cancer treatment': [PlatformCategory.BIOMEDICAL],
  'oncology': [PlatformCategory.BIOMEDICAL],
  'genetics': [PlatformCategory.BIOMEDICAL],
  'genome': [PlatformCategory.BIOMEDICAL],
  'dna': [PlatformCategory.BIOMEDICAL],
  'rna': [PlatformCategory.BIOMEDICAL],
  'protein': [PlatformCategory.BIOMEDICAL],
  'cell': [PlatformCategory.BIOMEDICAL],
  'immunology': [PlatformCategory.BIOMEDICAL],
  'vaccine': [PlatformCategory.BIOMEDICAL],
  'clinical trial': [PlatformCategory.BIOMEDICAL],
  'medical': [PlatformCategory.BIOMEDICAL],
  'health': [PlatformCategory.BIOMEDICAL],
  'disease': [PlatformCategory.BIOMEDICAL],
  'therapy': [PlatformCategory.BIOMEDICAL],
  'pharmaceutical': [PlatformCategory.BIOMEDICAL],
  'biochemistry': [PlatformCategory.BIOMEDICAL],
  'microbiology': [PlatformCategory.BIOMEDICAL],
  'neuroscience': [PlatformCategory.BIOMEDICAL],
  'cardiology': [PlatformCategory.BIOMEDICAL],
  'epidemiology': [PlatformCategory.BIOMEDICAL],
  'public health': [PlatformCategory.BIOMEDICAL],
  
  // 计算机科学关键词
  'artificial intelligence': [PlatformCategory.COMPUTER_SCIENCE],
  'machine learning': [PlatformCategory.COMPUTER_SCIENCE],
  'deep learning': [PlatformCategory.COMPUTER_SCIENCE],
  'neural network': [PlatformCategory.COMPUTER_SCIENCE],
  'computer vision': [PlatformCategory.COMPUTER_SCIENCE],
  'natural language processing': [PlatformCategory.COMPUTER_SCIENCE],
  'nlp': [PlatformCategory.COMPUTER_SCIENCE],
  'algorithm': [PlatformCategory.COMPUTER_SCIENCE],
  'data structure': [PlatformCategory.COMPUTER_SCIENCE],
  'programming': [PlatformCategory.COMPUTER_SCIENCE],
  'software': [PlatformCategory.COMPUTER_SCIENCE],
  'database': [PlatformCategory.COMPUTER_SCIENCE],
  'network': [PlatformCategory.COMPUTER_SCIENCE],
  'security': [PlatformCategory.COMPUTER_SCIENCE],
  'cryptography': [PlatformCategory.COMPUTER_SCIENCE],
  'blockchain': [PlatformCategory.COMPUTER_SCIENCE],
  'distributed system': [PlatformCategory.COMPUTER_SCIENCE],
  'cloud computing': [PlatformCategory.COMPUTER_SCIENCE],
  'big data': [PlatformCategory.COMPUTER_SCIENCE],
  'iot': [PlatformCategory.COMPUTER_SCIENCE],
  'robotics': [PlatformCategory.COMPUTER_SCIENCE],
  'computer architecture': [PlatformCategory.COMPUTER_SCIENCE],
  
  // 物理数学关键词
  'quantum': [PlatformCategory.PHYSICS_MATH],
  'physics': [PlatformCategory.PHYSICS_MATH],
  'mathematics': [PlatformCategory.PHYSICS_MATH],
  'statistics': [PlatformCategory.PHYSICS_MATH],
  'algebra': [PlatformCategory.PHYSICS_MATH],
  'calculus': [PlatformCategory.PHYSICS_MATH],
  'geometry': [PlatformCategory.PHYSICS_MATH],
  'topology': [PlatformCategory.PHYSICS_MATH],
  'mechanics': [PlatformCategory.PHYSICS_MATH],
  'thermodynamics': [PlatformCategory.PHYSICS_MATH],
  'electromagnetism': [PlatformCategory.PHYSICS_MATH],
  'optics': [PlatformCategory.PHYSICS_MATH],
  'astrophysics': [PlatformCategory.PHYSICS_MATH],
  'cosmology': [PlatformCategory.PHYSICS_MATH],
  'particle physics': [PlatformCategory.PHYSICS_MATH],
  'string theory': [PlatformCategory.PHYSICS_MATH],
  'relativity': [PlatformCategory.PHYSICS_MATH]
};

/**
 * 平台推荐权重配置
 */
export const PLATFORM_RECOMMENDATION_WEIGHTS = {
  categoryMatch: 0.4,
  successRate: 0.3,
  responseTime: 0.2,
  coverage: 0.1
};

/**
 * 查询预处理配置
 */
export const QUERY_PREPROCESSING_CONFIG = {
  minQueryLength: 2,
  maxQueryLength: 500,
  commonMisspellings: {
    'artificial inteligence': 'artificial intelligence',
    'maching learning': 'machine learning',
    'neural networks': 'neural network',
    'computer vision': 'computer vision',
    'natural language processing': 'natural language processing',
    'deep learning': 'deep learning',
    'cancer research': 'cancer research',
    'genetic engineering': 'genetic engineering',
    'quantum computing': 'quantum computing',
    'block chain': 'blockchain'
  },
  booleanOperators: ['AND', 'OR', 'NOT'],
  fieldSuggestions: {
    'author': 'author',
    'title': 'title', 
    'abstract': 'abstract',
    'keywords': 'keywords',
    'fulltext': 'fulltext'
  }
};