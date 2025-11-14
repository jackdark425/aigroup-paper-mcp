import { z } from 'zod';
import { getDriver } from '../drivers/index.js';
import { PlatformSource } from '../types/paper.js';
import { Logger } from '../core/logger.js';

const logger = new Logger('FetchPaperTool');

export const fetchPaperSchema = z.object({
  id: z.string().describe('Paper ID (platform-specific format)'),
  source: z.nativeEnum(PlatformSource)
    .describe('Platform source (arxiv, openalex, pmc, etc.)')
});

export type FetchPaperInput = z.infer<typeof fetchPaperSchema>;

export async function fetchPaper(params: FetchPaperInput) {
  logger.info(`Fetching paper ${params.id} from ${params.source}`);
  
  const driver = getDriver(params.source);
  
  if (!driver) {
    throw new Error(`Driver for ${params.source} not found or not enabled`);
  }
  
  const paper = await driver.fetchPaper(params.id);
  
  return paper;
}