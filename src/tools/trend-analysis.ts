import { z } from 'zod';
import { getDriver, getEnabledDrivers } from '../drivers/index.js';
import { PlatformSource } from '../types/paper.js';
import { Logger } from '../core/logger.js';
import { calculateDateRange, generateTimeIntervals } from './trend/date-utils.js';
import { extractKeywords } from './trend/keyword-extractor.js';
import { generateInsights } from './trend/insight-generator.js';
import { searchForPeriod } from './trend/search-executor.js';

const logger = new Logger('TrendAnalysisTool');

export const trendAnalysisSchema = z.object({
  topic: z.string()
    .min(1, 'Topic cannot be empty')
    .max(500, 'Topic too long (max 500 characters)')
    .describe('Topic to analyze trends for'),
  sources: z.array(z.nativeEnum(PlatformSource)).optional()
    .describe('Platform sources to analyze (leave empty for all enabled platforms)'),
  period: z.enum(['week', 'month', 'year', 'all']).default('year')
    .describe('Time period for analysis'),
  granularity: z.enum(['day', 'week', 'month']).default('month')
    .describe('Time granularity for analysis'),
  limit: z.number().int().positive().max(1000).default(100)
    .describe('Maximum number of papers to analyze per time period'),
  useCache: z.boolean().default(true)
    .describe('Whether to use cache for trend analysis'),
  timeout: z.number().int().positive().max(120000).default(45000)
    .describe('Timeout for trend analysis in milliseconds')
});

export type TrendAnalysisInput = z.infer<typeof trendAnalysisSchema>;

export interface TrendDataPoint {
  period: string;
  count: number;
  papers: any[];
  avgCitations?: number;
  topKeywords?: string[];
}

export interface TrendAnalysisResult {
  topic: string;
  period: string;
  granularity: string;
  totalPapers: number;
  growthRate?: number;
  peakPeriod?: string;
  dataPoints: TrendDataPoint[];
  insights: string[];
  warnings?: string[];
}

/**
 * 验证时间粒度和周期的合理性
 */
function validateTimeGranularity(period: string, granularity: string): string[] {
  const warnings: string[] = [];
  
  // 定义合理的粒度组合
  const maxIntervals: Record<string, Record<string, number>> = {
    'week': { 'day': 7, 'week': 1, 'month': 1 },
    'month': { 'day': 30, 'week': 4, 'month': 1 },
    'year': { 'day': 365, 'week': 52, 'month': 12 },
    'all': { 'day': 5475, 'week': 780, 'month': 180 } // ~15 years
  };
  
  const maxAllowed = maxIntervals[period]?.[granularity];
  
  if (maxAllowed && maxAllowed > 100) {
    warnings.push(`时间区间过多（预计${maxAllowed}个），建议使用更粗的时间粒度或缩短分析周期`);
  }
  
  // 针对特定不合理的组合给出建议
  if (period === 'week' && granularity === 'month') {
    warnings.push('周级别分析建议使用天或周粒度');
  }
  
  if (period === 'all' && granularity === 'day') {
    warnings.push('全时间范围分析不建议使用天粒度，建议使用月粒度');
  }
  
  return warnings;
}

/**
 * 调整时间粒度以避免过多数据点
 */
function adjustGranularityIfNeeded(
  period: string, 
  granularity: string,
  warnings: string[]
): string {
  // 如果是"all"周期且使用天粒度，自动调整为月粒度
  if (period === 'all' && granularity === 'day') {
    warnings.push('自动将天粒度调整为月粒度以优化性能');
    return 'month';
  }
  
  return granularity;
}

export async function analyzeTrends(params: TrendAnalysisInput): Promise<TrendAnalysisResult> {
  // 验证主题
  const cleanedTopic = params.topic.trim();
  if (!cleanedTopic) {
    throw new Error('Topic cannot be empty');
  }
  
  logger.info(`Analyzing trends for topic: ${cleanedTopic}`);
  
  const warnings: string[] = [];
  
  // 验证时间粒度
  const granularityWarnings = validateTimeGranularity(params.period, params.granularity);
  warnings.push(...granularityWarnings);
  
  // 必要时调整粒度
  const adjustedGranularity = adjustGranularityIfNeeded(
    params.period, 
    params.granularity,
    warnings
  );
  
  const { start, end } = calculateDateRange(params.period);
  const intervals = generateTimeIntervals(start, end, adjustedGranularity);
  
  // 限制最大区间数
  const MAX_INTERVALS = 100;
  if (intervals.length > MAX_INTERVALS) {
    warnings.push(`时间区间数量(${intervals.length})超过限制，仅分析最近${MAX_INTERVALS}个区间`);
    intervals.splice(0, intervals.length - MAX_INTERVALS);
  }
  
  logger.debug(`Analysis period: ${start.toISOString()} to ${end.toISOString()}`);
  logger.debug(`Time intervals: ${intervals.length} intervals`);
  
  // 确定要使用的驱动
  const drivers = params.sources && params.sources.length > 0
    ? params.sources.map(source => getDriver(source)).filter(d => d !== undefined)
    : getEnabledDrivers();
  
  if (drivers.length === 0) {
    throw new Error('No enabled drivers available');
  }
  
  const dataPoints: TrendDataPoint[] = [];
  let totalPapers = 0;
  
  // 限制每个时间区间的搜索时间
  const timePerInterval = Math.max(5000, Math.floor(params.timeout / intervals.length));
  
  if (timePerInterval < 10000 && intervals.length > 10) {
    warnings.push(`每个时间区间的搜索时间较短(${timePerInterval}ms)，可能影响结果质量`);
  }
  
  // 为每个时间区间搜索论文
  for (let i = 0; i < intervals.length; i++) {
    const period = intervals[i];
    
    try {
      const filteredPapers = await searchForPeriod(
        drivers,
        cleanedTopic,
        params.sources,
        params.limit,
        timePerInterval,
        start,
        end
      );
      
      const count = filteredPapers.length;
      totalPapers += count;
      
      const avgCitations = filteredPapers.length > 0
        ? filteredPapers.reduce((sum, paper) => sum + (paper.citationCount || 0), 0) / filteredPapers.length
        : 0;
      
      const topKeywords = extractKeywords(filteredPapers);
      
      dataPoints.push({
        period,
        count,
        papers: filteredPapers.slice(0, 3), // 只保留前3篇用于展示
        avgCitations: avgCitations > 0 ? Number(avgCitations.toFixed(1)) : undefined,
        topKeywords: topKeywords.length > 0 ? topKeywords : undefined
      });
      
      logger.debug(`Period ${period}: ${count} papers`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Failed to analyze period ${period}`, { error: errorMessage });
      warnings.push(`时间段 ${period} 分析失败: ${errorMessage}`);
      
      // 添加空数据点继续处理
      dataPoints.push({
        period,
        count: 0,
        papers: []
      });
    }
  }
  
  // 生成洞察
  const insights = generateInsights(dataPoints, cleanedTopic);
  
  // 计算增长率 - 修复除零错误
  let growthRate: number | undefined;
  if (dataPoints.length >= 2 && dataPoints[0].count > 0) {
    growthRate = ((dataPoints[dataPoints.length - 1].count - dataPoints[0].count) / dataPoints[0].count) * 100;
  } else if (dataPoints.length >= 2) {
    // 如果起始为0，但结束不为0，则增长率为100%
    growthRate = dataPoints[dataPoints.length - 1].count > 0 ? 100 : undefined;
  }
  
  // 找到高峰期
  const peakPeriod = dataPoints.length > 0
    ? dataPoints.reduce((max, point) => point.count > max.count ? point : max, dataPoints[0]).period
    : undefined;
  
  return {
    topic: cleanedTopic,
    period: params.period,
    granularity: adjustedGranularity,
    totalPapers,
    growthRate: growthRate !== undefined ? Number(growthRate.toFixed(1)) : undefined,
    peakPeriod,
    dataPoints,
    insights,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}