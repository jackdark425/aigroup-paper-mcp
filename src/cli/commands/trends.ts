import { analyzeTrends } from '../../tools/trend-analysis.js';
import { parseNumber, parseSources } from '../utils/parsers.js';
import { outputTrends } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function trendsCommand(topic: string, options: any) {
  logger.info('Executing trends command', { topic, options });
  
  const trends = await analyzeTrends({
    topic,
    sources: parseSources(options.sources),
    period: options.period,
    granularity: options.granularity,
    limit: parseNumber(options.limit, 100, 1),
    useCache: true,
    timeout: 45000
  });

  outputTrends(trends, options.format);
}