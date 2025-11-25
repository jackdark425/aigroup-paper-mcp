import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { PlatformSource } from '../../../../types/index.js';
import { paperListSchema } from '../schemas/common.js';

export const fetchLatestConfig = {
  name: 'fetch_latest',
  title: '获取最新论文',
  description: '从特定类别的平台获取最新论文。具有智能缓存和摘要模式功能。',
  inputSchema: {
    source: z.nativeEnum(PlatformSource).describe('要获取的平台源'),
    category: z.string().optional().describe('要获取的类别/主题（可选）'),
    limit: z.number().optional().describe('要获取的最大论文数（默认：10，最大：50）'),
    useCache: z.boolean().optional().describe('是否使用缓存（默认：true）'),
    summaryOnly: z.boolean().optional().describe('仅返回摘要信息'),
    enableEnhancement: z.boolean().optional().describe('启用结果增强（默认：true）')
  },
  outputSchema: paperListSchema
};

/**
 * 创建category参数的completable配置
 * 需要在运行时注入getCategoriesForSource函数
 */
export function createCategoryCompletable(getCategoriesForSource: (source: PlatformSource) => Promise<string[]>) {
  return completable(
    z.string().optional(),
    async (value, context) => {
      if (context?.arguments?.source) {
        const source = context.arguments.source as PlatformSource;
        const categories = await getCategoriesForSource(source);
        return categories.filter((c: string) => c.toLowerCase().includes((value || '').toLowerCase()));
      }
      return [];
    }
  );
}