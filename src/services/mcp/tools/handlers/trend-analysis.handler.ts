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
      trends: Array.isArray(result.dataPoints) ? result.dataPoints.map((dp: any) => ({
        period: dp.period || '',
        paperCount: dp.count || 0,
        growthRate: result.growthRate || 0,
        topKeywords: Array.isArray(dp.topKeywords) ? dp.topKeywords : []
      })) : [],
      topic: result.topic || args.topic || '',
      totalPapers: result.totalPapers || 0
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