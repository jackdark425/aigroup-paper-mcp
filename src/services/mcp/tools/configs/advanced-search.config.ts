import { z } from 'zod';
import { PlatformSource, SearchField } from '../../../../types/index.js';

export const advancedSearchConfig = {
  name: 'advanced_search',
  title: '高级搜索',
  description: '具有布尔运算符（AND、OR、NOT）、模糊匹配和精确匹配功能的高级搜索。',
  inputSchema: {
    query: z.string().describe('带有布尔运算符的搜索查询'),
    sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要搜索的特定平台'),
    field: z.nativeEnum(SearchField).optional().describe('搜索字段'),
    fuzzyMatch: z.boolean().optional().describe('启用模糊匹配（默认：false）'),
    exactMatch: z.boolean().optional().describe('启用精确匹配（默认：false）'),
    limit: z.number().optional().describe('每个平台的最大结果数（默认：10）'),
    offset: z.number().optional().describe('分页偏移量（默认：0）')
  },
  outputSchema: {
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      authors: z.array(z.string()),
      relevance: z.number().optional()
    })),
    total: z.number()
  }
};