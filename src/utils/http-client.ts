import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '../core/logger.js';
import { AppError } from '../core/error-handler.js';
import { 
  DEFAULT_RETRY_CONFIG,
  ErrorClassifier,
  ErrorEnhancementEngine
} from '../core/error-suggestions.js';
import { 
  RetryConfig,
  ErrorCategory
} from '../types/error.js';

export interface HttpClientOptions {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * 重试状态跟踪
 */
interface RetryState {
  attempt: number;
  lastError?: any;
  nextRetryDelay: number;
  totalDelay: number;
}

/**
 * 增强的HTTP客户端 - 带智能重试和错误处理
 */
export class HttpClient {
  private client: AxiosInstance;
  private logger: Logger;
  private retryConfig: RetryConfig;
  
  constructor(private options: HttpClientOptions) {
    this.logger = new Logger('HttpClient');
    
    // 合并重试配置
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
      maxRetries: options.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries
    };
    
    this.client = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'aigroup-paper-mcp/0.1.0',
        ...options.headers
      }
    });

    // 添加响应拦截器用于错误增强
    this.client.interceptors.response.use(
      response => response,
      error => {
        // 增强错误信息
        const enhancedError = ErrorEnhancementEngine.enhance(error, {
          operation: 'HTTP请求',
          platform: this.options.baseUrl
        });
        
        this.logger.debug('HTTP请求失败，错误已增强', {
          category: enhancedError.category,
          isRetryable: enhancedError.isRetryable,
          userMessage: enhancedError.userFriendlyMessage
        });
        
        // 将增强信息附加到错误对象
        error.enhancedInfo = enhancedError;
        return Promise.reject(error);
      }
    );
  }
  
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, config);
  }
  
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, { ...config, data });
  }
  
  /**
   * 执行HTTP请求（带智能重试）
   */
  private async request<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    retryState?: RetryState
  ): Promise<T> {
    const state: RetryState = retryState || {
      attempt: 0,
      nextRetryDelay: this.retryConfig.initialDelay,
      totalDelay: 0
    };

    try {
      this.logger.debug(`${method} ${url}`, { 
        attempt: state.attempt + 1,
        maxRetries: this.retryConfig.maxRetries
      });
      
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        ...config
      });
      
      // 请求成功，记录性能指标
      if (state.attempt > 0) {
        this.logger.info('请求在重试后成功', {
          url,
          attempts: state.attempt + 1,
          totalDelay: state.totalDelay
        });
      }
      
      return response.data;
    } catch (error: any) {
      // 分析错误
      const errorCategory = ErrorClassifier.classify(error);
      const shouldRetry = this.shouldRetry(error, errorCategory, state.attempt);
      
      if (shouldRetry && state.attempt < this.retryConfig.maxRetries) {
        // 计算下次重试延迟
        const delay = this.calculateRetryDelay(state.attempt, errorCategory);
        
        this.logger.warn(
          `请求失败，将在 ${delay}ms 后重试`, 
          {
            url,
            method,
            attempt: state.attempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            errorCategory,
            errorMessage: error.message
          }
        );
        
        // 等待后重试
        await this.sleep(delay);
        
        // 更新重试状态
        const newState: RetryState = {
          attempt: state.attempt + 1,
          lastError: error,
          nextRetryDelay: delay,
          totalDelay: state.totalDelay + delay
        };
        
        return this.request<T>(method, url, config, newState);
      }
      
      // 不应该重试或已达到最大重试次数
      this.logger.error(`请求最终失败`, {
        url,
        method,
        attempts: state.attempt + 1,
        errorCategory,
        errorMessage: error.message
      });
      
      // 抛出增强的错误
      throw this.enhanceHttpError(error, method, url, state);
    }
  }
  
  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any, category: ErrorCategory, attempt: number): boolean {
    // 已达到最大重试次数
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    // 检查是否是可重试的错误类别
    if (this.retryConfig.retryableCategories.includes(category)) {
      return true;
    }

    // 检查HTTP状态码
    const statusCode = error.response?.status;
    if (statusCode && this.retryConfig.retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // 检查网络错误
    if (!error.response && error.code) {
      // 网络连接错误通常可以重试
      const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
      return networkErrors.includes(error.code);
    }

    return false;
  }
  
  /**
   * 计算重试延迟（使用指数退避 + 可选抖动）
   */
  private calculateRetryDelay(attempt: number, category: ErrorCategory): number {
    // 基础延迟使用指数退避
    let delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, attempt);
    
    // 限制最大延迟
    delay = Math.min(delay, this.retryConfig.maxDelay);
    
    // 对于限流错误，使用更长的延迟
    if (category === ErrorCategory.API_RATE_LIMIT) {
      delay = Math.max(delay, 5000); // 至少等待5秒
    }
    
    // 添加抖动以避免"惊群效应"
    if (this.retryConfig.useJitter) {
      const jitter = delay * 0.1 * Math.random(); // 0-10%的随机抖动
      delay = delay + jitter;
    }
    
    return Math.floor(delay);
  }
  
  /**
   * 增强HTTP错误
   */
  private enhanceHttpError(error: any, method: string, url: string, state: RetryState): AppError {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.enhancedInfo?.userFriendlyMessage || 
                        error.message || 
                        'HTTP请求失败';
    
    // 构建详细的错误信息
    const details: any = {
      url,
      method,
      attempts: state.attempt + 1,
      totalDelay: state.totalDelay
    };
    
    if (error.enhancedInfo) {
      details.category = error.enhancedInfo.category;
      details.suggestions = error.enhancedInfo.suggestions.slice(0, 3).map((s: any) => ({
        title: s.title,
        description: s.description
      }));
    }
    
    if (error.response) {
      details.statusCode = error.response.status;
      details.statusText = error.response.statusText;
    }
    
    if (error.code) {
      details.errorCode = error.code;
    }
    
    return new AppError(
      errorMessage,
      error.enhancedInfo?.code || 'HTTP_ERROR',
      statusCode,
      details
    );
  }
  
  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取当前重试配置
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
  
  /**
   * 更新重试配置
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
    this.logger.info('重试配置已更新', { config: this.retryConfig });
  }
}

/**
 * 创建带默认配置的HTTP客户端
 */
export function createHttpClient(options: HttpClientOptions): HttpClient {
  return new HttpClient(options);
}