import { z } from 'zod';

export const smartCacheSearchConfig = {
  name: 'smart_cache_search',
  title: '智能缓存搜索',
  description: '基于语义相似度在缓存中查找相关文献数据，即使查询内容不完全相同也能找到相关结果。',
  inputSchema: {
    query: z.string()
      .describe('搜索查询，系统会基于语义相似度查找相关缓存'),
    similarityThreshold: z.number().min(0).max(1).default(0.7)
      .describe('语义相似度阈值（0-1，默认0.7）'),
    maxResults: z.number().int().positive().max(50).default(10)
      .describe('最大返回结果数'),
    includeExpired: z.boolean().default(false)
      .describe('是否包含过期缓存（默认不包含）')
  },
  outputSchema: {
    action: z.string(),
    query: z.string(),
    totalKeys: z.number(),
    validKeys: z.number(),
    matchedResults: z.number(),
    similarityThreshold: z.number(),
    results: z.array(z.any()),
    suggestions: z.array(z.string()),
    message: z.string()
  }
};