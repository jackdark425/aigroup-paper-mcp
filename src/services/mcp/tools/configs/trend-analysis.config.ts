import { z } from 'zod';
import { PlatformSource } from '../../../../types/index.js';
import { trendDataPointSchema } from '../schemas/common.js';

export const trendAnalysisConfig = {
  name: 'trend_analysis',
  title: '研究趋势分析',
  description: '分析特定主题随时间的变化趋势，包括增长率、高峰期和关键词分析。',
  inputSchema: {
    topic: z.string().describe('要分析趋势的主题'),
    sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要分析的平台源'),
    period: z.enum(['week', 'month', 'year', 'all']).optional().describe('分析时间段'),
    granularity: z.enum(['day', 'week', 'month']).optional().describe('时间粒度'),
    limit: z.number().optional().describe('每个时间段要分析的最大论文数')
  },
  outputSchema: {
    trends: z.array(trendDataPointSchema),
    topic: z.string(),
    totalPapers: z.number()
  }
};