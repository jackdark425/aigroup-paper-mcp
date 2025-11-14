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
  topic: z.string().describe('Topic to analyze trends for'),
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

export async function analyzeTrends(params: TrendAnalysisInput): Promise<TrendAnalysisResult> {
  logger.info(`Analyzing trends for topic: ${params.topic}`);
  
  const { start, end } = calculateDateRange(params.period);
  const intervals = generateTimeIntervals(start, end, params.granularity);
  
  logger.debug(`Analysis period: ${start.toISOString()} to ${end.toISOString()}`);
  logger.debug(`Time intervals: ${intervals.join(', ')}`);
  
  // 确定要使用的驱动
  const drivers = params.sources && params.sources.length > 0
    ? params.sources.map(source => getDriver(source)).filter(d => d !== undefined)
    : getEnabledDrivers();
  
  if (drivers.length === 0) {
    throw new Error('No enabled drivers available');
  }
  
  const dataPoints: TrendDataPoint[] = [];
  let totalPapers = 0;
  const warnings: string[] = [];
  
  // 限制每个时间区间的搜索时间
  const timePerInterval = Math.floor(params.timeout / intervals.length);
  if (timePerInterval < 5000) {
    warnings.push('时间区间过多，建议减少时间粒度或缩短分析周期');
  }
  
  // 为每个时间区间搜索论文
  for (let i = 0; i < intervals.length; i++) {
    const period = intervals[i];
    
    try {
      const filteredPapers = await searchForPeriod(
        drivers,
        params.topic,
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
  const insights = generateInsights(dataPoints, params.topic);
  
  // 计算增长率
  const growthRate = dataPoints.length >= 2
    ? ((dataPoints[dataPoints.length - 1].count - dataPoints[0].count) / dataPoints[0].count) * 100
    : undefined;
  
  // 找到高峰期
  const peakPeriod = dataPoints.length > 0
    ? dataPoints.reduce((max, point) => point.count > max.count ? point : max, dataPoints[0]).period
    : undefined;
  
  return {
    topic: params.topic,
    period: params.period,
    granularity: params.granularity,
    totalPapers,
    growthRate: growthRate ? Number(growthRate.toFixed(1)) : undefined,
    peakPeriod,
    dataPoints,
    insights,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}