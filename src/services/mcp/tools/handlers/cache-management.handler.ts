import { Logger } from '../../../../core/logger.js';
import { manageCache } from '../../../../tools/index.js';

const logger = new Logger('CacheManagementHandler');

export async function handleCacheManagement(args: any) {
  try {
    const result = await manageCache(args);
    
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
    logger.error(`缓存管理失败: ${error.message}`);
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