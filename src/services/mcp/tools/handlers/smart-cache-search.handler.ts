import { Logger } from '../../../../core/logger.js';
import { smartCacheSearch } from '../../../../tools/index.js';
import { ToolResponse } from './types.js';

const logger = new Logger('SmartCacheSearchHandler');

export async function handleSmartCacheSearch(args: any): Promise<ToolResponse> {
  try {
    const result = await smartCacheSearch(args);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    };
  } catch (error: any) {
    logger.error(`智能缓存搜索失败: ${error.message}`);
    return {
      content: [
        {
          type: 'text' as const,
          text: `错误: ${error.message}`
        }
      ],
      isError: true
    };
  }
}