import { Logger } from './logger.js';
import { 
  ErrorEnhancementEngine 
} from './error-suggestions.js';
import {
  EnhancedErrorInfo,
  ErrorCategory,
  ErrorSeverity
} from '../types/error.js';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DriverError extends AppError {
  constructor(message: string, public source: string, details?: any) {
    super(message, 'DRIVER_ERROR', 500, details);
    this.name = 'DriverError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * 增强的错误处理器 - 带智能错误分析和建议
 */
export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');
  private static errorStats = new Map<ErrorCategory, number>();

  /**
   * 处理错误并返回增强的错误信息
   */
  static handle(
    error: any,
    context?: {
      operation?: string;
      platform?: string;
      query?: string;
      parameters?: Record<string, any>;
    }
  ): { isError: boolean; content: Array<{ type: string; text: string }> } {
    // 增强错误信息
    const enhancedError = ErrorEnhancementEngine.enhance(error, context);
    
    // 记录错误统计
    this.recordError(enhancedError);
    
    // 记录详细日志
    this.logger.error('错误发生', {
      category: enhancedError.category,
      severity: enhancedError.severity,
      message: enhancedError.message,
      userFriendlyMessage: enhancedError.userFriendlyMessage,
      context: enhancedError.context,
      isRetryable: enhancedError.isRetryable,
      retryCount: enhancedError.retryCount,
      maxRetries: enhancedError.maxRetries
    });

    // 构建用户友好的错误响应
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: this.formatEnhancedError(enhancedError)
        }
      ]
    };
  }

  /**
   * 格式化增强的错误信息为用户友好的文本
   */
  private static formatEnhancedError(error: EnhancedErrorInfo): string {
    const sections: string[] = [];

    // 1. 错误摘要
    sections.push('='.repeat(60));
    sections.push(`❌ 错误 [${error.severity.toUpperCase()}]`);
    sections.push('='.repeat(60));
    sections.push('');
    sections.push(`📋 **错误描述**: ${error.userFriendlyMessage}`);
    sections.push('');

    // 2. 错误详情
    if (error.context) {
      sections.push('📊 **错误详情**:');
      if (error.context.operation) {
        sections.push(`  • 操作: ${error.context.operation}`);
      }
      if (error.context.platform) {
        sections.push(`  • 平台: ${error.context.platform}`);
      }
      if (error.context.query) {
        sections.push(`  • 查询: "${error.context.query}"`);
      }
      sections.push(`  • 错误类别: ${this.getCategoryDisplayName(error.category)}`);
      sections.push(`  • 严重程度: ${this.getSeverityDisplayName(error.severity)}`);
      if (error.isRetryable) {
        sections.push(`  • 可重试: 是 (${error.retryCount}/${error.maxRetries})`);
      }
      sections.push('');
    }

    // 3. 建议的解决方案（优先显示）
    if (error.suggestions.length > 0) {
      sections.push('💡 **建议的解决方案**:');
      sections.push('');
      
      error.suggestions.slice(0, 3).forEach((suggestion, index) => {
        sections.push(`${index + 1}. **${suggestion.title}** (置信度: ${Math.round(suggestion.confidence * 100)}%)`);
        sections.push(`   ${suggestion.description}`);
        
        if (suggestion.actions && suggestion.actions.length > 0) {
          sections.push('   步骤:');
          suggestion.actions.forEach(action => {
            sections.push(`   • ${action}`);
          });
        }
        
        if (suggestion.alternativeQuery) {
          sections.push(`   建议查询: "${suggestion.alternativeQuery}"`);
        }
        
        if (suggestion.alternativePlatforms && suggestion.alternativePlatforms.length > 0) {
          sections.push(`   备选平台: ${suggestion.alternativePlatforms.join(', ')}`);
        }
        
        if (suggestion.parameterAdjustments) {
          sections.push('   参数调整建议:');
          Object.entries(suggestion.parameterAdjustments).forEach(([key, value]) => {
            sections.push(`   • ${key}: ${JSON.stringify(value)}`);
          });
        }
        
        sections.push('');
      });
    }

    // 4. 详细解决步骤
    if (error.solutions.length > 0) {
      const primarySolution = error.solutions[0];
      sections.push('🔧 **详细解决步骤**:');
      sections.push('');
      sections.push(`**${primarySolution.title}**`);
      sections.push(primarySolution.description);
      sections.push('');
      
      primarySolution.steps.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
      sections.push('');
      
      if (primarySolution.estimatedTime) {
        sections.push(`⏱️ 预计解决时间: ${primarySolution.estimatedTime} 分钟`);
      }
      
      if (primarySolution.documentationUrl) {
        sections.push(`📖 参考文档: ${primarySolution.documentationUrl}`);
      }
      
      if (primarySolution.requiresSupport) {
        sections.push('⚠️ 如问题持续，可能需要技术支持');
      }
      sections.push('');
    }

    // 5. 技术详情（仅在高严重度错误时显示）
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      sections.push('🔍 **技术详情** (用于调试):');
      sections.push(`  • 错误代码: ${error.code}`);
      sections.push(`  • 错误类型: ${error.category}`);
      if (error.originalError) {
        sections.push(`  • 原始消息: ${error.originalError.message}`);
      }
      if (error.details) {
        sections.push(`  • 额外详情: ${JSON.stringify(error.details, null, 2)}`);
      }
      sections.push('');
    }

    sections.push('='.repeat(60));

    return sections.join('\n');
  }

  /**
   * 获取错误类别的显示名称
   */
  private static getCategoryDisplayName(category: ErrorCategory): string {
    const names: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK_TIMEOUT]: '网络超时',
      [ErrorCategory.NETWORK_CONNECTION]: '网络连接失败',
      [ErrorCategory.NETWORK_DNS]: 'DNS解析失败',
      [ErrorCategory.API_AUTH_FAILED]: 'API认证失败',
      [ErrorCategory.API_RATE_LIMIT]: 'API限流',
      [ErrorCategory.API_QUOTA_EXCEEDED]: 'API配额超限',
      [ErrorCategory.API_INVALID_REQUEST]: 'API请求无效',
      [ErrorCategory.API_SERVER_ERROR]: 'API服务器错误',
      [ErrorCategory.DATA_PARSE_ERROR]: '数据解析错误',
      [ErrorCategory.DATA_FORMAT_ERROR]: '数据格式错误',
      [ErrorCategory.DATA_MISSING]: '数据缺失',
      [ErrorCategory.DATA_INVALID]: '数据无效',
      [ErrorCategory.CONFIG_INVALID_PARAM]: '配置参数无效',
      [ErrorCategory.CONFIG_PLATFORM_ERROR]: '平台配置错误',
      [ErrorCategory.CONFIG_MISSING]: '配置缺失',
      [ErrorCategory.VALIDATION_FAILED]: '验证失败',
      [ErrorCategory.RESOURCE_NOT_FOUND]: '资源未找到',
      [ErrorCategory.UNKNOWN_ERROR]: '未知错误'
    };
    return names[category] || category;
  }

  /**
   * 获取严重程度的显示名称
   */
  private static getSeverityDisplayName(severity: ErrorSeverity): string {
    const names: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: '低 ℹ️',
      [ErrorSeverity.MEDIUM]: '中等 ⚠️',
      [ErrorSeverity.HIGH]: '高 🔴',
      [ErrorSeverity.CRITICAL]: '严重 ⛔'
    };
    return names[severity] || severity;
  }

  /**
   * 记录错误统计
   */
  private static recordError(error: EnhancedErrorInfo): void {
    const count = this.errorStats.get(error.category) || 0;
    this.errorStats.set(error.category, count + 1);
    
    // 每100个错误记录一次统计日志
    const totalErrors = Array.from(this.errorStats.values()).reduce((a, b) => a + b, 0);
    if (totalErrors % 100 === 0) {
      this.logger.info('错误统计', {
        total: totalErrors,
        byCategory: Object.fromEntries(this.errorStats)
      });
    }
  }

  /**
   * 获取错误统计
   */
  static getErrorStatistics(): Map<ErrorCategory, number> {
    return new Map(this.errorStats);
  }

  /**
   * 清除错误统计
   */
  static clearStatistics(): void {
    this.errorStats.clear();
  }

  /**
   * 简化的错误处理 - 向后兼容
   */
  static handleSimple(error: any): { isError: boolean; content: Array<{ type: string; text: string }> } {
    this.logger.error('错误发生', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      details: error.details || undefined
    });

    // 如果是已知的AppError类型
    if (error instanceof AppError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              code: error.code,
              details: error.details
            }, null, 2)
          }
        ]
      };
    }

    // 处理其他类型的错误
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: '发生了未预期的错误',
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }
      ]
    };
  }
}