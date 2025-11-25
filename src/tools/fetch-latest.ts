import { z } from 'zod';
import { getDriver } from '../drivers/index.js';
import { PlatformSource, Paper } from '../types/paper.js';
import { Logger } from '../core/logger.js';
import { StorageFactory, StorageType } from '../storage/storage-factory.js';
import { config } from '../config/index.js';
import { CACHE_TTL } from '../config/constants.js';
import { ResultEnhancer } from '../core/result-enhancer.js';

const logger = new Logger('FetchLatestTool');

// 简化的论文摘要类型
interface PaperSummary {
  id: string;
  title: string;
  authors: Array<{ name: string }>;
  publishedDate: Date;
  source: PlatformSource;
  citationCount?: number;
  abstract?: string;
  doi?: string;
  // 增强的元数据
  impactScore?: number;
  influenceLevel?: string;
  fullTextAvailable?: boolean;
}

export const fetchLatestSchema = z.object({
  source: z.nativeEnum(PlatformSource)
    .describe('Platform source to fetch from'),
  category: z.string().optional()
    .describe('Category/subject to fetch from (platform-specific)'),
  limit: z.number().int().positive().max(50).default(10)
    .describe('Maximum number of papers to fetch'),
  useCache: z.boolean().default(true)
    .describe('Whether to use cache for this request'),
  cacheTtl: z.number().int().positive().optional()
    .describe('Cache TTL in seconds (overrides default)'),
  saveToFile: z.boolean().default(false)
    .describe('Whether to save FULL results to a JSON file (recommended for large datasets)'),
  outputPath: z.string().optional()
    .describe('Output file path for saving results (if saveToFile is true)'),
  maxResponseSize: z.number().int().positive().optional()
    .describe('Maximum response size in characters (auto-truncates if exceeded)'),
  summaryOnly: z.boolean().optional()
    .describe('Return only summary info (auto-enabled for limit > 10 to avoid context limits)'),
  enableEnhancement: z.boolean().default(true)
    .describe('Enable result enhancement (impact scoring, smart summaries, etc.)')
});

export type FetchLatestInput = z.infer<typeof fetchLatestSchema>;

export async function fetchLatest(params: FetchLatestInput) {
  // 智能默认值：当请求大量论文时自动启用摘要模式
  const autoSummary = params.limit > 10;
  const useSummaryMode = params.summaryOnly ?? autoSummary;
  const enableEnhancement = params.enableEnhancement ?? true;
  
  logger.info(`Fetching latest ${params.limit} papers from ${params.source}/${params.category || 'default'}`, {
    useCache: params.useCache,
    saveToFile: params.saveToFile,
    summaryMode: useSummaryMode,
    enableEnhancement,
    autoEnabled: autoSummary && params.summaryOnly === undefined
  });
  
  // 初始化缓存
  let cacheStorage;
  if (params.useCache && config.cache.enabled) {
    cacheStorage = StorageFactory.create(
      config.cache.storage?.type as StorageType || StorageType.JSON_FILE,
      {
        path: config.cache.storage?.path,
        defaultTtl: config.cache.storage?.defaultTtl,
        maxSize: config.cache.storage?.maxSize
      },
      config.cache.storage?.namespace
    );
  }

  // 生成缓存键
  const cacheKey = `fetch_latest:${params.source}:${params.category || 'default'}:${params.limit}:${useSummaryMode}:${enableEnhancement}`;
  
  // 尝试从缓存获取
  if (params.useCache && cacheStorage) {
    try {
      const cached = await cacheStorage.get(cacheKey);
      if (cached) {
        logger.info(`✓ Cache hit for ${cacheKey}`);
        return {
          ...cached,
          cached: true,
          cacheKey,
          message: '✓ Data loaded from cache (fast!)'
        };
      }
    } catch (error) {
      logger.warn('Cache read failed, proceeding with fresh fetch', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  const driver = getDriver(params.source);
  
  if (!driver) {
    throw new Error(`Driver for ${params.source} not found or not enabled`);
  }
  
  let papers = await driver.fetchLatest(params.category || 'cs.AI', params.limit);
  
  // 应用结果增强（如果启用）
  if (enableEnhancement && papers.length > 0) {
    logger.info('开始增强论文结果...');
    papers = await Promise.all(papers.map(paper => ResultEnhancer.enhancePaper(paper)));
    logger.info('论文增强完成');
  }
  
  // 计算原始数据大小
  const originalSize = JSON.stringify(papers).length;
  
  // 处理返回结果，避免大模型上下文超限
  let processedPapers: Paper[] | PaperSummary[] = papers;
  let processingMessage = '';
  
  if (useSummaryMode) {
    // 只返回摘要信息（包含增强的元数据）
    processedPapers = papers.map(paper => {
      const summary: PaperSummary = {
        id: paper.id,
        title: paper.title,
        authors: paper.authors.slice(0, 3).map(a => ({ name: a.name })),
        publishedDate: paper.publishedDate,
        source: paper.source,
        citationCount: paper.citationCount,
        abstract: paper.abstract ? paper.abstract.substring(0, 200) + '...' : undefined,
        doi: paper.doi,
        fullTextAvailable: paper.fullTextAvailable
      };
      
      // 添加增强的元数据
      if (enableEnhancement && paper.enhancedMetadata) {
        summary.impactScore = paper.enhancedMetadata.impactScore;
        summary.influenceLevel = paper.enhancedMetadata.influenceLevel;
      }
      
      return summary;
    });
    
    const processedSize = JSON.stringify(processedPapers).length;
    const reduction = ((1 - processedSize / originalSize) * 100).toFixed(1);
    processingMessage = `📊 Summary mode enabled: Reduced data size by ${reduction}% (${originalSize} → ${processedSize} bytes)`;
    
    if (enableEnhancement) {
      processingMessage += '\n✨ Enhanced with impact scores and influence levels';
    }
    
    if (autoSummary && params.summaryOnly === undefined) {
      processingMessage += '\n💡 Auto-enabled because limit > 10 (to avoid LLM context limits)';
    }
  } else if (enableEnhancement) {
    processingMessage = '✨ Papers enhanced with impact analysis and smart summaries';
  }
  
  const result = {
    papers: processedPapers,
    source: params.source,
    category: params.category || 'cs.AI',
    count: papers.length,
    originalCount: papers.length,
    processedCount: processedPapers.length,
    cached: false,
    cacheKey: params.useCache ? cacheKey : undefined,
    summaryMode: useSummaryMode,
    enhancementEnabled: enableEnhancement,
    message: processingMessage || undefined
  };
  
  // 如果设置了最大响应大小，检查并截断
  if (params.maxResponseSize) {
    const resultString = JSON.stringify(result);
    if (resultString.length > params.maxResponseSize) {
      const maxPapers = Math.max(1, Math.floor(params.maxResponseSize / 1000));
      logger.warn(`Response size ${resultString.length} exceeds limit ${params.maxResponseSize}, truncating to ${maxPapers} papers`);
      
      const truncatedResult = {
        ...result,
        papers: result.papers.slice(0, maxPapers),
        truncated: true,
        truncatedCount: maxPapers,
        originalRequestedCount: params.limit,
        message: `⚠️ Response auto-truncated to ${maxPapers} papers (size limit: ${params.maxResponseSize} bytes)\n💾 Full data saved to file/cache`
      };
      
      // 保存完整结果到缓存
      if (params.useCache && cacheStorage) {
        try {
          const ttl = params.cacheTtl || CACHE_TTL.LATEST_PAPERS;
          await cacheStorage.set(cacheKey, result, ttl); // 保存完整数据
          logger.info(`✓ Cached FULL result for ${cacheKey} with TTL ${ttl}s`);
        } catch (error) {
          logger.warn('Cache write failed', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // 保存完整结果到文件
      if (params.saveToFile) {
        await saveToFile(result, params.outputPath, { isTruncated: true });
      }
      
      return truncatedResult;
    }
  }
  
  // 保存到缓存
  if (params.useCache && cacheStorage) {
    try {
      const ttl = params.cacheTtl || CACHE_TTL.LATEST_PAPERS;
      await cacheStorage.set(cacheKey, result, ttl);
      logger.info(`✓ Cached result for ${cacheKey} with TTL ${ttl}s`);
    } catch (error) {
      logger.warn('Cache write failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // 保存到文件
  if (params.saveToFile) {
    await saveToFile(result, params.outputPath);
  }
  
  return result;
}

/**
 * 保存结果到文件
 */
async function saveToFile(result: any, outputPath?: string, options?: { isTruncated?: boolean }): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultPath = `./output/latest_${result.source}_${result.category}_${timestamp}.json`;
    const path = outputPath || defaultPath;
    
    const { promises: fs } = await import('fs');
    const { dirname } = await import('path');
    
    // 确保目录存在
    await fs.mkdir(dirname(path), { recursive: true });
    
    // 添加元数据
    const fileData = {
      metadata: {
        savedAt: new Date().toISOString(),
        source: result.source,
        category: result.category,
        totalPapers: result.count,
        summaryMode: result.summaryMode,
        enhancementEnabled: result.enhancementEnabled,
        ...(options?.isTruncated && { note: 'This file contains the FULL data. Response was truncated due to size limits.' })
      },
      ...result
    };
    
    // 保存文件
    await fs.writeFile(path, JSON.stringify(fileData, null, 2), 'utf-8');
    
    logger.info(`✓ Results saved to file: ${path}`);
    
    // 返回文件路径信息
    result.savedToFile = path;
    result.message = (result.message || '') + `\n💾 Full data saved to: ${path}`;
  } catch (error) {
    logger.error('Failed to save results to file', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}