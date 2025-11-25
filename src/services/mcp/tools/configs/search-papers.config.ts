import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { PlatformSource, SearchField, SortField, SortOrder } from '../../../../types/index.js';
import { searchResultSchema } from '../schemas/common.js';

export const searchPapersConfig = {
  name: 'search_papers',
  title: '学术论文搜索',
  description: '跨多个学术平台搜索论文（arXiv、OpenAlex等）。支持多字段搜索、过滤和排序。',
  inputSchema: {
    query: z.string().describe('搜索查询关键词。系统会自动优化和纠正拼写错误。'),
    sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要搜索的特定平台。'),
    field: completable(
      z.nativeEnum(SearchField).optional(),
      (value) => {
        const fields = Object.values(SearchField);
        return Promise.resolve(
          fields.filter(f => f.toLowerCase().startsWith((value || '').toLowerCase()))
        );
      }
    ).describe('搜索字段：全部、标题、摘要、作者、关键词、全文。'),
    categories: z.array(z.string()).optional().describe('按类别/主题过滤。'),
    sortBy: z.nativeEnum(SortField).optional().describe('排序字段'),
    sortOrder: z.nativeEnum(SortOrder).optional().describe('排序顺序'),
    limit: z.number().optional().describe('每个平台的最大结果数（默认：10，最大：100）'),
    offset: z.number().optional().describe('分页偏移量（默认：0）')
  },
  outputSchema: searchResultSchema
};