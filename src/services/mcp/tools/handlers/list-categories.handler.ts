import { Logger } from '../../../../core/logger.js';
import { listCategories } from '../../../../tools/index.js';

const logger = new Logger('ListCategoriesHandler');

export async function handleListCategories(args: any) {
  try {
    const result = await listCategories(args);
    
    // 映射返回值到 outputSchema 期望的结构
    const categories: any[] = [];
    if (result.platforms) {
      for (const platform of result.platforms) {
        for (const cat of platform.categories) {
          categories.push({
            source: platform.source,
            category: typeof cat === 'string' ? cat : cat.category || cat.name,
            description: typeof cat === 'object' ? cat.description : undefined,
            paperCount: typeof cat === 'object' ? cat.paperCount : undefined
          });
        }
      }
    }
    
    const mappedResult = {
      categories
    };
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: mappedResult
    };
  } catch (error: any) {
    logger.error(`列出类别失败: ${error.message}`);
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