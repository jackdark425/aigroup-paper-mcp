/**
 * 错误分类枚举
 */
export enum ErrorCategory {
  // 网络相关错误
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION = 'NETWORK_CONNECTION',
  NETWORK_DNS = 'NETWORK_DNS',
  
  // API相关错误
  API_AUTH_FAILED = 'API_AUTH_FAILED',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_INVALID_REQUEST = 'API_INVALID_REQUEST',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  
  // 数据相关错误
  DATA_PARSE_ERROR = 'DATA_PARSE_ERROR',
  DATA_FORMAT_ERROR = 'DATA_FORMAT_ERROR',
  DATA_MISSING = 'DATA_MISSING',
  DATA_INVALID = 'DATA_INVALID',
  
  // 配置相关错误
  CONFIG_INVALID_PARAM = 'CONFIG_INVALID_PARAM',
  CONFIG_PLATFORM_ERROR = 'CONFIG_PLATFORM_ERROR',
  CONFIG_MISSING = 'CONFIG_MISSING',
  
  // 验证相关错误
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  // 其他错误
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',        // 可以忽略或警告
  MEDIUM = 'medium',  // 可以恢复，但需要注意
  HIGH = 'high',      // 严重错误，需要处理
  CRITICAL = 'critical' // 致命错误，无法继续
}

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
  RETRY = 'retry',               // 重试操作
  FALLBACK = 'fallback',         // 使用降级方案
  SKIP = 'skip',                 // 跳过该操作
  USER_ACTION = 'user_action',   // 需要用户操作
  ABORT = 'abort'                // 中止操作
}

/**
 * 错误建议类型
 */
export interface ErrorSuggestion {
  // 建议类型
  type: 'alternative_query' | 'alternative_platform' | 'parameter_adjustment' | 'configuration_fix' | 'manual_action';
  
  // 建议标题
  title: string;
  
  // 建议描述
  description: string;
  
  // 具体操作步骤
  actions?: string[];
  
  // 替代查询（如果适用）
  alternativeQuery?: string;
  
  // 替代平台（如果适用）
  alternativePlatforms?: string[];
  
  // 参数调整建议（如果适用）
  parameterAdjustments?: Record<string, any>;
  
  // 置信度 (0-1)
  confidence: number;
  
  // 优先级 (1-10)
  priority: number;
}

/**
 * 错误解决方案
 */
export interface ErrorSolution {
  // 解决方案标题
  title: string;
  
  // 详细说明
  description: string;
  
  // 具体步骤
  steps: string[];
  
  // 相关文档链接
  documentationUrl?: string;
  
  // 估计解决时间（分钟）
  estimatedTime?: number;
  
  // 是否需要技术支持
  requiresSupport?: boolean;
}

/**
 * 增强的错误信息
 */
export interface EnhancedErrorInfo {
  // 基础错误信息
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  // 原始错误
  originalError?: Error;
  
  // 错误详情
  details?: any;
  
  // 错误上下文
  context?: {
    operation?: string;
    platform?: string;
    query?: string;
    parameters?: Record<string, any>;
    timestamp?: string;
  };
  
  // 用户友好的错误描述
  userFriendlyMessage: string;
  
  // 建议的恢复策略
  recoveryStrategy: RecoveryStrategy;
  
  // 错误建议
  suggestions: ErrorSuggestion[];
  
  // 解决方案
  solutions: ErrorSolution[];
  
  // 是否可重试
  isRetryable: boolean;
  
  // 重试次数（如果已重试）
  retryCount?: number;
  
  // 最大重试次数
  maxRetries?: number;
}

/**
 * 错误统计信息
 */
export interface ErrorStatistics {
  // 错误分类统计
  byCategory: Record<ErrorCategory, number>;
  
  // 错误严重程度统计
  bySeverity: Record<ErrorSeverity, number>;
  
  // 平台错误统计
  byPlatform: Record<string, number>;
  
  // 总错误数
  total: number;
  
  // 可恢复错误数
  recoverable: number;
  
  // 致命错误数
  critical: number;
  
  // 时间范围
  timeRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 重试配置
 */
export interface RetryConfig {
  // 最大重试次数
  maxRetries: number;
  
  // 初始延迟（毫秒）
  initialDelay: number;
  
  // 最大延迟（毫秒）
  maxDelay: number;
  
  // 退避因子
  backoffFactor: number;
  
  // 是否使用抖动
  useJitter: boolean;
  
  // 可重试的HTTP状态码
  retryableStatusCodes: number[];
  
  // 可重试的错误类别
  retryableCategories: ErrorCategory[];
}

/**
 * 降级配置
 */
export interface FallbackConfig {
  // 是否启用降级
  enabled: boolean;
  
  // 降级平台映射
  platformFallbacks: Record<string, string[]>;
  
  // 降级查询策略
  queryFallbacks: {
    // 简化查询
    simplifyQuery?: boolean;
    
    // 扩大搜索范围
    expandScope?: boolean;
    
    // 使用同义词
    useSynonyms?: boolean;
  };
  
  // 降级参数
  parameterFallbacks: Record<string, any>;
}