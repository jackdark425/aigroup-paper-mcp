import { z } from 'zod';
import { PlatformSource } from '../../../../types/index.js';
import { paperSchema } from '../schemas/common.js';

export const fetchPaperConfig = {
  name: 'fetch_paper',
  title: '获取论文详情',
  description: '从指定平台根据ID获取论文的详细信息。返回完整的元数据。',
  inputSchema: {
    id: z.string().describe('平台特定格式的论文ID'),
    source: z.nativeEnum(PlatformSource).describe('论文所在平台源')
  },
  outputSchema: {
    paper: paperSchema
  }
};