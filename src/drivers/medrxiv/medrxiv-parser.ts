/**
 * medRxiv解析器
 * 由于medRxiv和bioRxiv使用相同的API架构，我们复用BiorxivParser
 */

import { BiorxivParser } from '../biorxiv/biorxiv-parser.js';

export { BiorxivParser as MedrxivParser };