import { searchPapers } from '../../tools/search-papers.js';
import { SearchField, SortField, SortOrder } from '../../types/search.js';
import { parseNumber, parseSources } from '../utils/parsers.js';
import { outputResults } from '../utils/output.js';
import { logger } from '../../core/logger.js';

export async function searchCommand(query: string, options: any) {
  logger.info('Executing search command', { query, options });
  
  const result = await searchPapers({
    query,
    sources: parseSources(options.sources),
    field: options.field as SearchField,
    categories: options.categories || [],
    sortBy: options.sortBy as SortField,
    sortOrder: options.sortOrder as SortOrder,
    limit: parseNumber(options.limit, 10, 1),
    offset: parseNumber(options.offset, 0, 0),
    enableSmartSuggestions: true,
    enableEnhancement: true,
    enableSearchStrategy: true
  });

  outputResults(result, options.format);
}