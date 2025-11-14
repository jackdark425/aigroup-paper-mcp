import { advancedSearch } from '../../tools/advanced-search.js';
import { SearchField } from '../../types/search.js';
import { parseNumber, parseSources } from '../utils/parsers.js';
import { outputResults } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function advancedSearchCommand(query: string, options: any) {
  logger.info('Executing advanced search command', { query, options });
  
  const result = await advancedSearch({
    query,
    sources: parseSources(options.sources),
    field: options.field as SearchField,
    fuzzyMatch: options.fuzzy && !options.exact,
    exactMatch: options.exact,
    caseSensitive: options.caseSensitive,
    limit: parseNumber(options.limit, 10, 1)
  });

  outputResults(result, options.format);
}