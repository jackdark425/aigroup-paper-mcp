import { z } from 'zod';
import { getDriver, getEnabledDrivers } from '../drivers/index.js';
import { PlatformSource } from '../types/paper.js';
import { Logger } from '../core/logger.js';

const logger = new Logger('ListCategoriesTool');

export const listCategoriesSchema = z.object({
  source: z.nativeEnum(PlatformSource).optional()
    .describe('Platform source (leave empty for all platforms)')
});

export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;

export async function listCategories(params: ListCategoriesInput) {
  logger.info(`Listing categories for ${params.source || 'all platforms'}`);
  
  const drivers = params.source
    ? [getDriver(params.source)].filter(d => d !== undefined)
    : getEnabledDrivers();
  
  if (drivers.length === 0) {
    throw new Error('No enabled drivers available');
  }
  
  const results = await Promise.allSettled(
    drivers.map(async driver => ({
      source: driver!.source,
      name: driver!.name,
      categories: await driver!.listCategories()
    }))
  );
  
  const categories = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);
  
  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason.message);
  
  return {
    platforms: categories,
    errors: errors.length > 0 ? errors : undefined
  };
}