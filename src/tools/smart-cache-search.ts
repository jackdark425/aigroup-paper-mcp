import { z } from 'zod';
import { StorageFactory, StorageType } from '../storage/storage-factory.js';
import { CacheItem } from '../storage/storage-interface.js';
import { config } from '../config/index.js';
import { Logger } from '../core/logger.js';

// 缓存数据的通用类型
interface CacheData {
  papers?: any[];
  query?: string;
  category?: string;
  source?: string;
  [key: string]: any;
}

const logger = new Logger('SmartCacheSearchTool');

export const smartCacheSearchSchema = z.object({
  query: z.string()
    .describe('搜索查询，系统会基于语义相似度查找相关缓存'),
  similarityThreshold: z.number().min(0).max(1).default(0.7)
    .describe('语义相似度阈值（0-1，默认0.7）'),
  maxResults: z.number().int().positive().max(50).default(10)
    .describe('最大返回结果数'),
  includeExpired: z.boolean().default(false)
    .describe('是否包含过期缓存（默认不包含）')
});

export type SmartCacheSearchInput = z.infer<typeof smartCacheSearchSchema>;

/**
 * 基于语义相似度的智能缓存搜索
 * 当用户查询内容不同但语义相关时，可以找到相关的缓存结果
 */
export async function smartCacheSearch(params: SmartCacheSearchInput) {
  const { query, similarityThreshold, maxResults, includeExpired } = params;
  
  logger.info('智能缓存搜索', {
    query,
    similarityThreshold,
    maxResults,
    includeExpired
  });

  // 初始化缓存存储
  const cacheStorage = StorageFactory.create(
    config.cache.storage?.type as StorageType || StorageType.JSON_FILE,
    {
      path: config.cache.storage?.path,
      defaultTtl: config.cache.storage?.defaultTtl,
      maxSize: config.cache.storage?.maxSize
    },
    config.cache.storage?.namespace
  );

  try {
    // 获取所有缓存键
    const allKeys = await cacheStorage.keys();
    
    // 过滤过期键（如果需要）
    let validKeys = allKeys;
    if (!includeExpired) {
      validKeys = await filterExpiredKeys(cacheStorage, allKeys);
    }
    
    // 计算查询与缓存键的相似度
    const scoredResults = await calculateSimilarityScores(query, validKeys, cacheStorage);
    
    // 过滤并排序结果
    const filteredResults = scoredResults
      .filter(result => result.similarityScore >= similarityThreshold)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, maxResults);
    
    // 获取匹配项的详细信息
    const detailedResults = await Promise.all(
      filteredResults.map(async result => {
        const item = await cacheStorage.get(result.key) as CacheItem<CacheData> | null;
        return {
          key: result.key,
          similarityScore: result.similarityScore,
          data: item?.data,
          metadata: {
            size: item ? JSON.stringify(item.data).length : 0,
            expiresAt: item?.expiresAt ? new Date(item.expiresAt).toISOString() : null,
            createdAt: item?.createdAt ? new Date(item.createdAt).toISOString() : null,
            ttlSeconds: item?.expiresAt ? Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000)) : 0
          }
        };
      })
    );
    
    return {
      action: 'smart_search',
      query,
      totalKeys: allKeys.length,
      validKeys: validKeys.length,
      matchedResults: filteredResults.length,
      similarityThreshold,
      results: detailedResults,
      suggestions: generateSuggestions(detailedResults, query),
      message: `找到 ${filteredResults.length} 个相关缓存项（相似度 ≥ ${similarityThreshold}）`
    };
    
  } catch (error) {
    logger.error('智能缓存搜索失败', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 过滤过期键
 */
async function filterExpiredKeys(cacheStorage: any, keys: string[]): Promise<string[]> {
  const validKeys: string[] = [];
  
  for (const key of keys) {
    const item = await cacheStorage.get(key) as CacheItem<any> | null;
    if (item && item.expiresAt > Date.now()) {
      validKeys.push(key);
    }
  }
  
  return validKeys;
}

/**
 * 计算查询与缓存键的语义相似度
 */
async function calculateSimilarityScores(
  query: string, 
  keys: string[], 
  cacheStorage: any
): Promise<Array<{key: string, similarityScore: number}>> {
  const results: Array<{key: string, similarityScore: number}> = [];
  
  // 预处理查询
  const queryTokens = preprocessText(query);
  
  for (const key of keys) {
    try {
      // 从缓存键和内容中提取文本特征
      const keyFeatures = extractFeaturesFromKey(key);
      const contentFeatures = await extractFeaturesFromContent(cacheStorage, key);
      
      // 合并特征
      const allFeatures = [...keyFeatures, ...contentFeatures];
      
      // 计算相似度
      const similarity = calculateTextSimilarity(queryTokens, allFeatures);
      
      results.push({
        key,
        similarityScore: similarity
      });
      
    } catch (error) {
      logger.warn(`计算相似度失败: ${key}`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return results;
}

/**
 * 预处理文本
 */
function preprocessText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // 移除标点
    .split(/\s+/)
    .filter(token => token.length > 2) // 过滤短词
    .filter((token, index, array) => array.indexOf(token) === index); // 去重
}

/**
 * 从缓存键中提取特征
 */
function extractFeaturesFromKey(key: string): string[] {
  const features: string[] = [];
  
  // 提取平台信息
  const platformMatch = key.match(/:(arxiv|openalex|pmc|biorxiv|medrxiv):/);
  if (platformMatch) {
    features.push(platformMatch[1]);
  }
  
  // 提取类别信息
  const categoryMatch = key.match(/:[^:]+:([^:]+):/);
  if (categoryMatch) {
    features.push(categoryMatch[1]);
  }
  
  // 提取查询关键词（针对搜索缓存）
  const searchMatch = key.match(/search_papers:([^:]+):/);
  if (searchMatch) {
    const searchQuery = searchMatch[1];
    features.push(...preprocessText(searchQuery));
  }
  
  return features;
}

/**
 * 从缓存内容中提取特征
 */
async function extractFeaturesFromContent(cacheStorage: any, key: string): Promise<string[]> {
  const item = await cacheStorage.get(key) as CacheItem<CacheData> | null;
  if (!item || !item.data) {
    return [];
  }
  
  const features: string[] = [];
  const data = item.data;
  
  // 从论文数据中提取特征
  if (data.papers && Array.isArray(data.papers)) {
    data.papers.forEach((paper: any) => {
      if (paper.title) {
        features.push(...preprocessText(paper.title));
      }
      if (paper.abstract) {
        features.push(...preprocessText(paper.abstract.substring(0, 200))); // 只取前200字符
      }
      if (paper.categories && Array.isArray(paper.categories)) {
        paper.categories.forEach((cat: string) => {
          features.push(cat.replace('cs.', '').replace('math.', '')); // 简化类别
        });
      }
    });
  }
  
  // 从搜索元数据中提取特征
  if (data.query) {
    features.push(...preprocessText(data.query));
  }
  if (data.category) {
    features.push(data.category);
  }
  if (data.source) {
    features.push(data.source);
  }
  
  return features.filter((feature, index, array) => array.indexOf(feature) === index); // 去重
}

/**
 * 计算文本相似度（基于Jaccard相似度）
 */
function calculateTextSimilarity(queryTokens: string[], features: string[]): number {
  if (features.length === 0) return 0;
  
  const querySet = new Set(queryTokens);
  const featureSet = new Set(features);
  
  const intersection = new Set([...querySet].filter(x => featureSet.has(x)));
  const union = new Set([...querySet, ...featureSet]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * 生成智能建议
 */
function generateSuggestions(results: any[], _query: string): string[] {
  const suggestions: string[] = [];
  
  if (results.length === 0) {
    suggestions.push('未找到相关缓存，建议重新搜索获取最新数据');
    return suggestions;
  }
  
  // 基于相似度分数提供建议
  const topResult = results[0];
  if (topResult.similarityScore >= 0.9) {
    suggestions.push('找到高度相关的缓存，可以直接使用');
  } else if (topResult.similarityScore >= 0.7) {
    suggestions.push('找到相关缓存，但建议验证数据时效性');
  } else {
    suggestions.push('找到部分相关缓存，建议结合新搜索使用');
  }
  
  // 基于缓存来源提供建议
  const sources = new Set();
  results.forEach(result => {
    const sourceMatch = result.key.match(/:(arxiv|openalex|pmc|biorxiv|medrxiv):/);
    if (sourceMatch) {
      sources.add(sourceMatch[1]);
    }
  });
  
  if (sources.size > 0) {
    suggestions.push(`相关数据来自: ${Array.from(sources).join(', ')}`);
  }
  
  // 基于数据时效性提供建议
  const recentResults = results.filter(result =>
    result.metadata.ttlSeconds > 3600 // 剩余TTL大于1小时
  );
  
  if (recentResults.length > 0) {
    suggestions.push(`${recentResults.length} 个缓存项数据较新`);
  } else {
    suggestions.push('大部分缓存数据即将过期，建议重新获取');
  }
  
  return suggestions;
}