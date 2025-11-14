/**
 * 错误分类器模块
 */

import {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy
} from '../../types/error.js';

/**
 * 错误分类器 - 将错误归类到具体的错误类别
 */
export class ErrorClassifier {
  /**
   * 分类错误
   */
  static classify(error: any): ErrorCategory {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const statusCode = error?.response?.status || error?.statusCode;

    // 网络错误
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ECONNRESET') {
      return ErrorCategory.NETWORK_CONNECTION;
    }
    if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
      return ErrorCategory.NETWORK_TIMEOUT;
    }
    if (errorCode === 'EAI_AGAIN' || errorMessage.includes('dns')) {
      return ErrorCategory.NETWORK_DNS;
    }

    // API错误
    if (statusCode === 401 || statusCode === 403 || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return ErrorCategory.API_AUTH_FAILED;
    }
    if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return ErrorCategory.API_RATE_LIMIT;
    }
    if (statusCode === 402 || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
      return ErrorCategory.API_QUOTA_EXCEEDED;
    }
    if (statusCode === 400 || errorMessage.includes('bad request') || errorMessage.includes('invalid')) {
      return ErrorCategory.API_INVALID_REQUEST;
    }
    if (statusCode >= 500 && statusCode < 600) {
      return ErrorCategory.API_SERVER_ERROR;
    }

    // 数据错误
    if (errorMessage.includes('parse') || errorMessage.includes('json') || errorMessage.includes('xml')) {
      return ErrorCategory.DATA_PARSE_ERROR;
    }
    if (errorMessage.includes('format') || errorMessage.includes('invalid data')) {
      return ErrorCategory.DATA_FORMAT_ERROR;
    }
    if (errorMessage.includes('missing') || errorMessage.includes('required')) {
      return ErrorCategory.DATA_MISSING;
    }

    // 配置错误
    if (errorMessage.includes('parameter') || errorMessage.includes('argument')) {
      return ErrorCategory.CONFIG_INVALID_PARAM;
    }
    if (errorMessage.includes('platform') || errorMessage.includes('source')) {
      return ErrorCategory.CONFIG_PLATFORM_ERROR;
    }

    // 验证错误
    if (errorMessage.includes('validation')) {
      return ErrorCategory.VALIDATION_FAILED;
    }

    // 资源未找到
    if (statusCode === 404 || errorMessage.includes('not found')) {
      return ErrorCategory.RESOURCE_NOT_FOUND;
    }

    return ErrorCategory.UNKNOWN_ERROR;
  }

  /**
   * 确定错误严重程度
   */
  static determineSeverity(category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.NETWORK_TIMEOUT:
      case ErrorCategory.API_RATE_LIMIT:
        return ErrorSeverity.MEDIUM;

      case ErrorCategory.NETWORK_CONNECTION:
      case ErrorCategory.NETWORK_DNS:
      case ErrorCategory.API_SERVER_ERROR:
        return ErrorSeverity.HIGH;

      case ErrorCategory.API_AUTH_FAILED:
      case ErrorCategory.API_QUOTA_EXCEEDED:
      case ErrorCategory.DATA_PARSE_ERROR:
        return ErrorSeverity.CRITICAL;

      case ErrorCategory.DATA_FORMAT_ERROR:
      case ErrorCategory.DATA_INVALID:
      case ErrorCategory.CONFIG_INVALID_PARAM:
      case ErrorCategory.VALIDATION_FAILED:
        return ErrorSeverity.MEDIUM;

      case ErrorCategory.RESOURCE_NOT_FOUND:
      case ErrorCategory.DATA_MISSING:
        return ErrorSeverity.LOW;

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 确定恢复策略
   */
  static determineRecoveryStrategy(category: ErrorCategory, severity: ErrorSeverity): RecoveryStrategy {
    // 致命错误需要用户操作
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.USER_ACTION;
    }

    switch (category) {
      case ErrorCategory.NETWORK_TIMEOUT:
      case ErrorCategory.NETWORK_CONNECTION:
      case ErrorCategory.API_RATE_LIMIT:
      case ErrorCategory.API_SERVER_ERROR:
        return RecoveryStrategy.RETRY;

      case ErrorCategory.RESOURCE_NOT_FOUND:
      case ErrorCategory.CONFIG_PLATFORM_ERROR:
        return RecoveryStrategy.FALLBACK;

      case ErrorCategory.DATA_MISSING:
      case ErrorCategory.DATA_FORMAT_ERROR:
        return RecoveryStrategy.SKIP;

      case ErrorCategory.API_AUTH_FAILED:
      case ErrorCategory.API_QUOTA_EXCEEDED:
      case ErrorCategory.CONFIG_INVALID_PARAM:
      case ErrorCategory.VALIDATION_FAILED:
        return RecoveryStrategy.USER_ACTION;

      default:
        return RecoveryStrategy.ABORT;
    }
  }
}