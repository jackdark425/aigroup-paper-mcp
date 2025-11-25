import { z } from 'zod';

export const cacheManagementConfig = {
  name: 'manage_cache',
  title: '缓存管理',
  description: '管理学术论文搜索的缓存系统，包括查看缓存内容、获取缓存项、清理缓存和获取统计信息。',
  inputSchema: {
    action: z.enum(['list', 'get', 'clear', 'stats'])
      .describe('缓存管理操作：列出键、获取项、清理缓存、获取统计信息'),
    key: z.string().optional()
      .describe('要获取的缓存键（get操作时必需）'),
    pattern: z.string().optional()
      .describe('过滤缓存键的模式（支持通配符 *）'),
    namespace: z.string().optional()
      .describe('要操作的缓存命名空间')
  },
  outputSchema: {
    action: z.string(),
    message: z.string(),
    totalKeys: z.number().optional(),
    filteredKeys: z.number().optional(),
    keys: z.array(z.any()).optional(),
    data: z.any().optional(),
    metadata: z.any().optional(),
    totalDeleted: z.number().optional(),
    remainingKeys: z.number().optional(),
    totalSizeBytes: z.number().optional(),
    totalSizeMB: z.string().optional(),
    averageItemSize: z.number().optional(),
    sourceDistribution: z.record(z.number()).optional()
  }
};