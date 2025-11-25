import { z } from 'zod';
import { PlatformSource } from '../../../../types/index.js';
import { categorySchema } from '../schemas/common.js';

export const listCategoriesConfig = {
  name: 'list_categories',
  title: '列出平台类别',
  description: '列出一个或所有平台的可用类别/主题。',
  inputSchema: {
    source: z.nativeEnum(PlatformSource).optional().describe('平台源（留空则列出所有平台的类别）')
  },
  outputSchema: {
    categories: z.array(categorySchema)
  }
};