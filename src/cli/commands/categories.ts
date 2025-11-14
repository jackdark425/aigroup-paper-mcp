import { listCategories } from '../../tools/list-categories.js';
import { PlatformSource } from '../../types/paper.js';
import { outputCategories } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function categoriesCommand(options: any) {
  logger.info('Executing categories command', { source: options.source });
  
  const categories = await listCategories({
    source: options.source as PlatformSource
  });

  outputCategories(categories, options.format);
}