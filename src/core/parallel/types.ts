/**
 * 并行搜索类型定义
 */

import { PlatformSource } from '../../types/paper.js';

/**
 * 并行搜索策略
 */
export enum ParallelStrategy {
  /** 全并行：所有平台同时搜索 */
  FULL_PARALLEL = 'full_parallel',
  /** 批量并行：分批次并行搜索 */
  BATCH_PARALLEL = 'batch_parallel',
  /** 智能并行：根据平台性能动态调整 */
  SMART_PARALLEL = 'smart_parallel',
  /** 顺序执行：依次搜索（用于调试） */
  SEQUENTIAL = 'sequential'
}

/**
 * 并行搜索配置
 */
export interface ParallelSearchConfig {
  /** 并行策略 */
  strategy: ParallelStrategy;
  /** 最大并发数 */
  maxConcurrency: number;
  /** 批次大小（批量并行时） */
  batchSize?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 启用结果流式返回 */
  enableStreaming?: boolean;
  /** 启用去重 */
  enableDeduplication?: boolean;
  /** 启用性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 并行搜索性能指标
 */
export interface ParallelSearchMetrics {
  /** 总耗时 */
  totalDuration: number;
  /** 平台数量 */
  platformCount: number;
  /** 成功平台数量 */
  successfulPlatforms: number;
  /** 失败平台数量 */
  failedPlatforms: number;
  /** 平均延迟 */
  averageLatency: number;
  /** 最大延迟 */
  maxLatency: number;
  /** 最小延迟 */
  minLatency: number;
  /** 总论文数 */
  totalPapers: number;
  /** 去重后论文数 */
  uniquePapers: number;
  /** 重复论文数 */
  duplicatePapers: number;
  /** 每个平台的详细指标 */
  platformMetrics: PlatformMetrics[];
  /** 并行效率（相对于顺序执行的加速比） */
  parallelEfficiency: number;
}

/**
 * 平台指标
 */
export interface PlatformMetrics {
  source: PlatformSource;
  success: boolean;
  latency: number;
  paperCount: number;
  error?: string;
}