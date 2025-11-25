import { z } from 'zod';
import { StorageFactory, StorageType } from '../storage/storage-factory.js';
import { config } from '../config/index.js';
import { Logger } from '../core/logger.js';

const logger = new Logger('CacheManagementTool');

export const cacheManagementSchema = z.object({
  action: z.enum(['list', 'get', 'clear', 'stats'])
    .describe('Cache management action: list keys, get item, clear cache, or get statistics'),
  key: z.string().optional()
    .describe('Cache key to get (required for get action)'),
  pattern: z.string().optional()
    .describe('Pattern to filter cache keys (supports wildcard *)'),
  namespace: z.string().optional()
    .describe('Cache namespace to operate on')
});

export type CacheManagementInput = z.infer<typeof cacheManagementSchema>;

export async function manageCache(params: CacheManagementInput) {
  const { action, key, pattern, namespace } = params;
  
  logger.info(`Cache management action: ${action}`, { key, pattern, namespace });

  // 初始化缓存存储
  const cacheStorage = StorageFactory.create(
    config.cache.storage?.type as StorageType || StorageType.JSON_FILE,
    {
      path: config.cache.storage?.path,
      defaultTtl: config.cache.storage?.defaultTtl,
      maxSize: config.cache.storage?.maxSize
    },
    namespace || config.cache.storage?.namespace
  );

  try {
    switch (action) {
      case 'list':
        return await listCacheKeys(cacheStorage, pattern);
      
      case 'get':
        if (!key) {
          throw new Error('Cache key is required for get action');
        }
        return await getCacheItem(cacheStorage, key);
      
      case 'clear':
        return await clearCache(cacheStorage, pattern);
      
      case 'stats':
        return await getCacheStats(cacheStorage);
      
      default:
        throw new Error(`Unknown cache action: ${action}`);
    }
  } catch (error) {
    logger.error(`Cache management failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 列出缓存键
 */
async function listCacheKeys(cacheStorage: any, pattern?: string): Promise<any> {
  const allKeys = await cacheStorage.keys();
  
  let filteredKeys = allKeys;
  if (pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    filteredKeys = allKeys.filter((key: string) => regex.test(key));
  }
  
  // 获取每个键的详细信息
  const keysWithInfo = await Promise.all(
    filteredKeys.map(async (key: string) => {
      // 使用getItem获取完整的CacheItem（如果可用）
      const item = typeof cacheStorage.getItem === 'function'
        ? await cacheStorage.getItem(key)
        : null;
      
      if (!item) {
        // 回退到get方法，但这只会返回数据
        const data = await cacheStorage.get(key);
        return {
          key,
          size: data ? JSON.stringify(data).length : 0,
          expiresAt: null,
          createdAt: null,
          isExpired: false
        };
      }
      
      // item是完整的CacheItem对象
      return {
        key,
        size: item.data ? JSON.stringify(item.data).length : 0,
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        isExpired: item.expiresAt ? Date.now() > item.expiresAt : false
      };
    })
  );
  
  return {
    action: 'list',
    totalKeys: allKeys.length,
    filteredKeys: filteredKeys.length,
    keys: keysWithInfo,
    pattern: pattern || undefined,
    message: `Found ${filteredKeys.length} cache keys${pattern ? ` matching pattern "${pattern}"` : ''}`
  };
}

/**
 * 获取缓存项
 */
async function getCacheItem(cacheStorage: any, key: string): Promise<any> {
  // 尝试使用getItem获取完整对象
  const item = typeof cacheStorage.getItem === 'function'
    ? await cacheStorage.getItem(key)
    : null;
  
  if (!item) {
    // 回退到get方法
    const data = await cacheStorage.get(key);
    if (!data) {
      return {
        action: 'get',
        key,
        found: false,
        message: `Cache key "${key}" not found or expired`
      };
    }
    
    return {
      action: 'get',
      key,
      found: true,
      data: data,
      metadata: {
        size: JSON.stringify(data).length
      },
      message: `Retrieved cache item "${key}" (metadata unavailable)`
    };
  }
  
  return {
    action: 'get',
    key,
    found: true,
    data: item.data,
    metadata: {
      size: JSON.stringify(item.data).length,
      expiresAt: new Date(item.expiresAt).toISOString(),
      createdAt: new Date(item.createdAt).toISOString(),
      ttlSeconds: Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000))
    },
    message: `Retrieved cache item "${key}"`
  };
}

/**
 * 清除缓存
 */
async function clearCache(cacheStorage: any, pattern?: string): Promise<any> {
  const allKeys = await cacheStorage.keys();
  
  let keysToDelete = allKeys;
  if (pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    keysToDelete = allKeys.filter((key: string) => regex.test(key));
  }
  
  // 删除匹配的键
  for (const key of keysToDelete) {
    await cacheStorage.delete(key);
  }
  
  return {
    action: 'clear',
    totalDeleted: keysToDelete.length,
    remainingKeys: allKeys.length - keysToDelete.length,
    pattern: pattern || undefined,
    message: `Cleared ${keysToDelete.length} cache keys${pattern ? ` matching pattern "${pattern}"` : ''}`
  };
}

/**
 * 获取缓存统计信息
 */
async function getCacheStats(cacheStorage: any): Promise<any> {
  const allKeys = await cacheStorage.keys();
  
  if (allKeys.length === 0) {
    return {
      action: 'stats',
      totalKeys: 0,
      activeKeys: 0,
      expiredKeys: 0,
      totalSizeBytes: 0,
      totalSizeMB: '0.00',
      averageItemSize: 0,
      sourceDistribution: {},
      message: 'Cache is empty'
    };
  }
  
  // 获取详细信息用于统计
  const items = await Promise.all(
    allKeys.map(async (key: string) => {
      // 使用getItem获取完整的CacheItem（如果可用）
      const item = typeof cacheStorage.getItem === 'function'
        ? await cacheStorage.getItem(key)
        : null;
      
      if (!item) {
        // 回退：只获取数据
        const data = await cacheStorage.get(key);
        return {
          key,
          size: data ? JSON.stringify(data).length : 0,
          expiresAt: null,
          createdAt: null,
          isExpired: false
        };
      }
      
      // item是完整的CacheItem对象
      return {
        key,
        size: item.data ? JSON.stringify(item.data).length : 0,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        isExpired: item.expiresAt ? Date.now() > item.expiresAt : false
      };
    })
  );
  
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const expiredItems = items.filter(item => item.isExpired);
  const activeItems = items.filter(item => !item.isExpired);
  
  // 按来源分组统计
  const sourceStats: Record<string, number> = {};
  items.forEach(item => {
    const source = extractSourceFromKey(item.key);
    if (source) {
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    }
  });
  
  return {
    action: 'stats',
    totalKeys: allKeys.length,
    activeKeys: activeItems.length,
    expiredKeys: expiredItems.length,
    totalSizeBytes: totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    averageItemSize: allKeys.length > 0 ? Math.round(totalSize / allKeys.length) : 0,
    sourceDistribution: sourceStats,
    message: `Cache statistics: ${allKeys.length} total keys, ${activeItems.length} active, ${expiredItems.length} expired`
  };
}

/**
 * 从缓存键中提取来源信息
 */
function extractSourceFromKey(key: string): string | null {
  const patterns = [
    /^fetch_latest:([^:]+):/,
    /^search_papers:([^:]+):/,
    /^fetch_paper:([^:]+):/
  ];
  
  for (const pattern of patterns) {
    const match = key.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}