import { Logger } from '../../../../core/logger.js';
import { analyzeTrends } from '../../../../tools/index.js';

const logger = new Logger('TrendAnalysisHandler');

export async function handleTrendAnalysis(args: any) {
  try {
    const toolArgs = {
      topic: args.topic,
      sources: args.sources,
      period: args.period || 'year',
      granularity: args.granularity || 'month',
      limit: args.limit || 100,
      useCache: true,
      timeout: 45000
    };
    
    const result = await analyzeTrends(toolArgs);
    
    // 映射返回值到 outputSchema 期望的结构
    const mappedResult = {
      trends: result.dataPoints.map(dp => ({
        period: dp.period,
        paperCount: dp.count,
        growthRate: result.growthRate,
        topKeywords: dp.topKeywords || []
      })),
      topic: result.topic,
      totalPapers: result.totalPapers
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: mappedResult
    };
  } catch (error: any) {
    logger.error(`趋势分析失败: ${error.message}`);
    return {
      content: [
        {
          type: 'text' as const,
          text: `错误: ${error.message}`
        }
      ],
      isError: true
    };
  }
}