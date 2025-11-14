import { PlatformSource } from '../types/paper.js';
import { HealthStatus } from '../types/driver.js';
import { Logger } from './logger.js';

const logger = new Logger('PlatformHealth');

/**
 * 平台性能指标
 */
export interface PlatformPerformanceMetrics {
  source: PlatformSource;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  lastChecked: Date;
  consecutiveFailures: number;
  isHealthy: boolean;
}

/**
 * 重试策略配置
 */
export interface RetryStrategy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  source: PlatformSource;
  healthy: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
}

/**
 * 平台健康监控器
 * 负责监控平台健康状态、性能统计和智能重试
 */
export class PlatformHealthMonitor {
  private static instance: PlatformHealthMonitor;
  private metrics: Map<PlatformSource, PlatformPerformanceMetrics>;
  private healthCheckCache: Map<PlatformSource, HealthCheckResult>;
  private readonly CACHE_TTL = 60000; // 1分钟缓存
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  private constructor() {
    this.metrics = new Map();
    this.healthCheckCache = new Map();
  }

  static getInstance(): PlatformHealthMonitor {
    if (!PlatformHealthMonitor.instance) {
      PlatformHealthMonitor.instance = new PlatformHealthMonitor();
    }
    return PlatformHealthMonitor.instance;
  }

  /**
   * 初始化平台指标
   */
  private initMetrics(source: PlatformSource): PlatformPerformanceMetrics {
    return {
      source,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      successRate: 1.0,
      averageLatency: 0,
      lastChecked: new Date(),
      consecutiveFailures: 0,
      isHealthy: true
    };
  }

  /**
   * 获取平台指标
   */
  getMetrics(source: PlatformSource): PlatformPerformanceMetrics {
    if (!this.metrics.has(source)) {
      this.metrics.set(source, this.initMetrics(source));
    }
    return this.metrics.get(source)!;
  }

  /**
   * 记录成功请求
   */
  recordSuccess(source: PlatformSource, latency: number): void {
    const metrics = this.getMetrics(source);
    
    metrics.successCount++;
    metrics.totalRequests++;
    metrics.consecutiveFailures = 0;
    metrics.successRate = metrics.successCount / metrics.totalRequests;
    
    // 更新平均延迟（移动平均）
    metrics.averageLatency = 
      (metrics.averageLatency * (metrics.successCount - 1) + latency) / metrics.successCount;
    
    metrics.lastChecked = new Date();
    metrics.isHealthy = true;

    logger.debug(`记录成功请求: ${source}`, {
      latency,
      successRate: metrics.successRate
    });
  }

  /**
   * 记录失败请求
   */
  recordFailure(source: PlatformSource, error: string): void {
    const metrics = this.getMetrics(source);
    
    metrics.failureCount++;
    metrics.totalRequests++;
    metrics.consecutiveFailures++;
    metrics.successRate = metrics.successCount / metrics.totalRequests;
    metrics.lastChecked = new Date();

    // 连续失败超过阈值则标记为不健康
    if (metrics.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      metrics.isHealthy = false;
      logger.warn(`平台标记为不健康: ${source}`, {
        consecutiveFailures: metrics.consecutiveFailures,
        successRate: metrics.successRate
      });
    }

    logger.debug(`记录失败请求: ${source}`, {
      error,
      consecutiveFailures: metrics.consecutiveFailures,
      successRate: metrics.successRate
    });
  }

  /**
   * 检查平台是否健康
   */
  isHealthy(source: PlatformSource): boolean {
    const metrics = this.getMetrics(source);
    return metrics.isHealthy && metrics.successRate > 0.5;
  }

  /**
   * 获取健康的平台列表
   */
  getHealthyPlatforms(platforms: PlatformSource[]): PlatformSource[] {
    return platforms.filter(source => this.isHealthy(source));
  }

  /**
   * 获取不健康的平台列表
   */
  getUnhealthyPlatforms(platforms: PlatformSource[]): PlatformSource[] {
    return platforms.filter(source => !this.isHealthy(source));
  }

  /**
   * 执行健康检查（带缓存）
   */
  async checkHealth(
    source: PlatformSource,
    healthCheckFn: () => Promise<HealthStatus>
  ): Promise<HealthCheckResult> {
    // 检查缓存
    const cached = this.healthCheckCache.get(source);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
      return cached;
    }

    const startTime = Date.now();
    try {
      const status = await healthCheckFn();
      const result: HealthCheckResult = {
        source,
        healthy: status.healthy,
        latency: status.latency || Date.now() - startTime,
        timestamp: new Date()
      };

      if (result.healthy) {
        this.recordSuccess(source, result.latency!);
      } else {
        this.recordFailure(source, status.message || 'Health check failed');
      }

      this.healthCheckCache.set(source, result);
      return result;
    } catch (error: any) {
      const result: HealthCheckResult = {
        source,
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };

      this.recordFailure(source, error.message);
      this.healthCheckCache.set(source, result);
      return result;
    }
  }

  /**
   * 批量健康检查
   */
  async checkMultiplePlatforms(
    checks: Array<{ source: PlatformSource; healthCheckFn: () => Promise<HealthStatus> }>
  ): Promise<HealthCheckResult[]> {
    const results = await Promise.allSettled(
      checks.map(({ source, healthCheckFn }) => 
        this.checkHealth(source, healthCheckFn)
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const source = checks[index].source;
        this.recordFailure(source, result.reason.message);
        return {
          source,
          healthy: false,
          error: result.reason.message,
          timestamp: new Date()
        };
      }
    });
  }

  /**
   * 获取重试策略
   */
  getRetryStrategy(source: PlatformSource): RetryStrategy {
    const metrics = this.getMetrics(source);
    
    // 根据历史性能调整重试策略
    const baseStrategy: RetryStrategy = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', '429', '503', '504']
    };

    // 如果平台健康度较差，减少重试次数
    if (metrics.successRate < 0.7) {
      baseStrategy.maxRetries = 2;
      baseStrategy.maxDelay = 5000;
    }

    // 如果连续失败，增加初始延迟
    if (metrics.consecutiveFailures > 0) {
      baseStrategy.initialDelay = 2000 * metrics.consecutiveFailures;
    }

    return baseStrategy;
  }

  /**
   * 判断错误是否可重试
   */
  isRetryableError(error: any, strategy: RetryStrategy): boolean {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.statusCode?.toString();

    return strategy.retryableErrors.some(retryable => 
      errorMessage.includes(retryable) || errorCode === retryable
    );
  }

  /**
   * 执行带重试的操作
   */
  async executeWithRetry<T>(
    source: PlatformSource,
    operation: () => Promise<T>,
    customStrategy?: Partial<RetryStrategy>
  ): Promise<T> {
    const strategy = { ...this.getRetryStrategy(source), ...customStrategy };
    let lastError: any;
    let delay = strategy.initialDelay;

    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const latency = Date.now() - startTime;
        this.recordSuccess(source, latency);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // 记录失败
        this.recordFailure(source, error.message);

        // 检查是否可重试
        if (!this.isRetryableError(error, strategy) || attempt === strategy.maxRetries) {
          throw error;
        }

        // 等待后重试
        logger.warn(`重试请求: ${source} (尝试 ${attempt + 1}/${strategy.maxRetries})`, {
          error: error.message,
          delay
        });

        await this.sleep(delay);
        delay = Math.min(delay * strategy.backoffMultiplier, strategy.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * 获取降级平台建议
   */
  getSuggestedFallbacks(
    failedPlatforms: PlatformSource[],
    allPlatforms: PlatformSource[]
  ): PlatformSource[] {
    // 获取健康的替代平台
    const healthyAlternatives = allPlatforms.filter(source => 
      !failedPlatforms.includes(source) && this.isHealthy(source)
    );

    // 按成功率排序
    return healthyAlternatives.sort((a, b) => {
      const metricsA = this.getMetrics(a);
      const metricsB = this.getMetrics(b);
      return metricsB.successRate - metricsA.successRate;
    });
  }

  /**
   * 重置平台健康状态（用于手动恢复）
   */
  resetPlatformHealth(source: PlatformSource): void {
    const metrics = this.getMetrics(source);
    metrics.consecutiveFailures = 0;
    metrics.isHealthy = true;
    this.healthCheckCache.delete(source);
    
    logger.info(`重置平台健康状态: ${source}`);
  }

  /**
   * 获取所有平台统计信息
   */
  getAllMetrics(): Map<PlatformSource, PlatformPerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.healthCheckCache.clear();
    logger.info('清除健康检查缓存');
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 导出指标统计
   */
  exportMetrics(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.metrics.forEach((metrics, source) => {
      stats[source] = {
        successRate: `${(metrics.successRate * 100).toFixed(2)}%`,
        totalRequests: metrics.totalRequests,
        averageLatency: `${metrics.averageLatency.toFixed(0)}ms`,
        isHealthy: metrics.isHealthy,
        consecutiveFailures: metrics.consecutiveFailures,
        lastChecked: metrics.lastChecked.toISOString()
      };
    });

    return stats;
  }
}

// 导出单例
export const platformHealthMonitor = PlatformHealthMonitor.getInstance();