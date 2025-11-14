import { fetchPaper } from '../../tools/fetch-paper.js';
import { PlatformSource } from '../../types/paper.js';
import { outputPaper } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function fetchCommand(id: string, options: any) {
  logger.info('Executing fetch command', { id, source: options.source });
  
  const paper = await fetchPaper({
    id,
    source: options.source as PlatformSource
  });

  outputPaper(paper, options.format);
}