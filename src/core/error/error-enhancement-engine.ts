/**
 * 错误增强引擎模块
 */

import {
  ErrorCategory,
  RecoveryStrategy,
  EnhancedErrorInfo
} from '../../types/error.js';
import { ErrorClassifier } from './error-classifier.js';
import { SuggestionGenerator } from './suggestion-generator.js';
import { SolutionProvider } from './solution-provider.js';

/**
 * 错误增强引擎 - 将简单错误转换为增强的错误信息
 */
export class ErrorEnhancementEngine {
  /**
   * 增强错误信息
   */
  static enhance(
    error: any,
    context?: {
      operation?: string;
      platform?: string;
      query?: string;
      parameters?: Record<string, any>;
    }
  ): EnhancedErrorInfo {
    const category = ErrorClassifier.classify(error);
    const severity = ErrorClassifier.determineSeverity(category);
    const recoveryStrategy = ErrorClassifier.determineRecoveryStrategy(category, severity);

    const suggestions = SuggestionGenerator.generate(category, context);
    const solutions = SolutionProvider.getSolutions(category);

    const userFriendlyMessage = this.generateUserFriendlyMessage(category);
    const isRetryable = this.isRetryable(category, recoveryStrategy);

    return {
      message: error?.message || '未知错误',
      code: error?.code || category,
      category,
      severity,
      originalError: error instanceof Error ? error : undefined,
      details: error?.details,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      },
      userFriendlyMessage,
      recoveryStrategy,
      suggestions,
      solutions,
      isRetryable,
      retryCount: error?.retryCount || 0,
      maxRetries: this.getMaxRetries(category)
    };
  }

  /**
   * 生成用户友好的错误消息
   */
  private static generateUserFriendlyMessage(category: ErrorCategory): string {
    const baseMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK_TIMEOUT]: '网络连接超时，请检查您的网络连接后重试',
      [ErrorCategory.NETWORK_CONNECTION]: '无法连接到服务器，请确认网络连接正常',
      [ErrorCategory.NETWORK_DNS]: 'DNS解析失败，请检查网络设置或稍后重试',
      [ErrorCategory.API_AUTH_FAILED]: 'API认证失败，请检查您的API密钥配置',
      [ErrorCategory.API_RATE_LIMIT]: 'API请求频率超过限制，请稍后再试',
      [ErrorCategory.API_QUOTA_EXCEEDED]: 'API配额已用尽，请等待配额重置或升级计划',
      [ErrorCategory.API_INVALID_REQUEST]: '请求参数无效，请检查输入参数',
      [ErrorCategory.API_SERVER_ERROR]: '服务器出现错误，请稍后重试',
      [ErrorCategory.DATA_PARSE_ERROR]: '数据解析失败，请稍后重试或使用其他平台',
      [ErrorCategory.DATA_FORMAT_ERROR]: '数据格式不正确，可能是平台API发生了变化',
      [ErrorCategory.DATA_MISSING]: '缺少必要的数据字段',
      [ErrorCategory.DATA_INVALID]: '数据验证失败，返回的数据不符合预期格式',
      [ErrorCategory.CONFIG_INVALID_PARAM]: '配置参数无效，请检查参数设置',
      [ErrorCategory.CONFIG_PLATFORM_ERROR]: '平台配置错误，请确认平台标识正确',
      [ErrorCategory.CONFIG_MISSING]: '缺少必要的配置信息',
      [ErrorCategory.VALIDATION_FAILED]: '参数验证失败，请检查输入值',
      [ErrorCategory.RESOURCE_NOT_FOUND]: '未找到相关资源或内容，建议调整搜索条件',
      [ErrorCategory.UNKNOWN_ERROR]: '发生了未知错误，请查看详细日志或联系技术支持'
    };

    return baseMessages[category] || '发生了错误，请稍后重试';
  }

  /**
   * 判断错误是否可重试
   */
  private static isRetryable(category: ErrorCategory, strategy: RecoveryStrategy): boolean {
    if (strategy === RecoveryStrategy.RETRY) {
      return true;
    }

    const retryableCategories = [
      ErrorCategory.NETWORK_TIMEOUT,
      ErrorCategory.NETWORK_CONNECTION,
      ErrorCategory.API_RATE_LIMIT,
      ErrorCategory.API_SERVER_ERROR
    ];

    return retryableCategories.includes(category);
  }

  /**
   * 获取最大重试次数
   */
  private static getMaxRetries(category: ErrorCategory): number {
    const retryLimits: Partial<Record<ErrorCategory, number>> = {
      [ErrorCategory.NETWORK_TIMEOUT]: 3,
      [ErrorCategory.NETWORK_CONNECTION]: 3,
      [ErrorCategory.API_RATE_LIMIT]: 2,
      [ErrorCategory.API_SERVER_ERROR]: 3,
      [ErrorCategory.DATA_PARSE_ERROR]: 2
    };

    return retryLimits[category] || 0;
  }
}