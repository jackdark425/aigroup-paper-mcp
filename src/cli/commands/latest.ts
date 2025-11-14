import { fetchLatest } from '../../tools/fetch-latest.js';
import { PlatformSource } from '../../types/paper.js';
import { parseNumber } from '../utils/parsers.js';
import { outputPapers } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function latestCommand(options: any) {
  logger.info('Executing latest command', { 
    source: options.source, 
    category: options.category,
    useCache: options.cache,
    saveToFile: options.saveToFile,
    summaryOnly: options.summaryOnly
  });
  
  const result = await fetchLatest({
    source: options.source as PlatformSource,
    category: options.category,
    limit: parseNumber(options.limit, 10, 1),
    enableEnhancement: true,
    useCache: options.cache,
    saveToFile: options.saveToFile,
    cacheTtl: options.cacheTtl ? parseNumber(options.cacheTtl, 3600, 1) : undefined,
    outputPath: options.outputPath,
    maxResponseSize: options.maxResponseSize ? parseNumber(options.maxResponseSize, 100000, 1000) : undefined,
    summaryOnly: options.summaryOnly || false
  });

  const papers = 'papers' in result ? result.papers : [];
  outputPapers(papers, options.format);
  
  // 显示缓存信息
  if (result.cached) {
    console.log('\n💾 Result loaded from cache');
  }
  if (result.cacheKey) {
    console.log(`Cache key: ${result.cacheKey}`);
  }
  if ('summaryMode' in result && result.summaryMode) {
    console.log('📋 Showing summary information only');
  }
  if ('truncated' in result && (result as any).truncated) {
    console.log(`⚠️  Response truncated: ${(result as any).truncatedCount}/${(result as any).originalRequestedCount} papers shown`);
  }
}