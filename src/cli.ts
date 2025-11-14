#!/usr/bin/env node

import { Command } from 'commander';
import { initializeDrivers } from './drivers/index.js';
import { validateOptions } from './cli/utils/validators.js';
import { handleError } from './cli/utils/error-handler.js';
import {
  searchCommand,
  advancedSearchCommand,
  fetchCommand,
  latestCommand,
  categoriesCommand,
  trendsCommand
} from './cli/commands/index.js';

// 初始化驱动
initializeDrivers();

const program = new Command();

program
  .name('aigroup-paper-mcp')
  .description('A unified academic paper search and retrieval CLI')
  .version('0.1.0');

// 基础搜索命令
program
  .command('search')
  .description('Search for academic papers across multiple platforms')
  .argument('<query>', 'Search query')
  .option('-s, --sources <sources...>', 'Platform sources to search (arxiv, openalex, pmc, etc.)')
  .option('-f, --field <field>', 'Search field (all, title, abstract, author, keywords, fulltext)', 'all')
  .option('-c, --categories <categories...>', 'Filter by categories')
  .option('--sort-by <field>', 'Sort field (relevance, date, citations, title)', 'relevance')
  .option('--sort-order <order>', 'Sort order (asc, desc)', 'desc')
  .option('-l, --limit <number>', 'Maximum results per platform', '10')
  .option('-o, --offset <number>', 'Offset for pagination', '0')
  .option('--format <format>', 'Output format (json, table, csv)', 'table')
  .action(async (query, options) => {
    try {
      validateOptions(options);
      await searchCommand(query, options);
    } catch (error: unknown) {
      handleError(error, 'Search');
    }
  });

// 高级搜索命令
program
  .command('advanced-search')
  .description('Advanced search with boolean operators and fuzzy matching')
  .argument('<query>', 'Search query with boolean operators (AND, OR, NOT)')
  .option('-s, --sources <sources...>', 'Platform sources to search')
  .option('--fuzzy', 'Enable fuzzy matching')
  .option('--exact', 'Enable exact matching (overrides fuzzy)')
  .option('--case-sensitive', 'Enable case-sensitive search')
  .option('--field <field>', 'Search field', 'all')
  .option('-l, --limit <number>', 'Maximum results per platform', '10')
  .option('--format <format>', 'Output format (json, table, csv)', 'table')
  .action(async (query, options) => {
    try {
      validateOptions(options);
      await advancedSearchCommand(query, options);
    } catch (error: unknown) {
      handleError(error, 'Advanced search');
    }
  });

// 获取论文详情命令
program
  .command('fetch')
  .description('Fetch detailed information about a specific paper')
  .argument('<id>', 'Paper ID')
  .requiredOption('-s, --source <source>', 'Platform source')
  .option('--format <format>', 'Output format (json, table)', 'table')
  .action(async (id, options) => {
    try {
      await fetchCommand(id, options);
    } catch (error: unknown) {
      handleError(error, 'Fetch');
    }
  });

// 获取最新论文命令
program
  .command('latest')
  .description('Fetch the latest papers from a specific category')
  .requiredOption('-s, --source <source>', 'Platform source')
  .requiredOption('-c, --category <category>', 'Category/subject')
  .option('-l, --limit <number>', 'Maximum number of papers', '10')
  .option('--no-cache', 'Disable cache for this request')
  .option('--cache-ttl <seconds>', 'Cache TTL in seconds (overrides default)')
  .option('--save-to-file', 'Save results to a JSON file')
  .option('--output-path <path>', 'Output file path for saving results')
  .option('--max-response-size <size>', 'Maximum response size in characters (to avoid LLM context limits)')
  .option('--summary-only', 'Return only summary information instead of full paper details')
  .option('--format <format>', 'Output format (json, table, csv)', 'table')
  .action(async (options) => {
    try {
      validateOptions(options);
      await latestCommand(options);
    } catch (error: unknown) {
      handleError(error, 'Fetch latest');
    }
  });

// 列出分类命令
program
  .command('categories')
  .description('List available categories for platforms')
  .option('-s, --source <source>', 'Platform source (leave empty for all)')
  .option('--format <format>', 'Output format (json, table)', 'table')
  .action(async (options) => {
    try {
      await categoriesCommand(options);
    } catch (error: unknown) {
      handleError(error, 'List categories');
    }
  });

// 主题趋势分析命令
program
  .command('trends')
  .description('Analyze topic trends over time')
  .argument('<topic>', 'Topic to analyze')
  .option('-s, --sources <sources...>', 'Platform sources to analyze')
  .option('--period <period>', 'Time period (week, month, year, all)', 'year')
  .option('--granularity <granularity>', 'Time granularity (day, week, month)', 'month')
  .option('-l, --limit <number>', 'Maximum papers per period', '100')
  .option('--format <format>', 'Output format (json, table, chart)', 'table')
  .action(async (topic, options) => {
    try {
      validateOptions(options);
      await trendsCommand(topic, options);
    } catch (error: unknown) {
      handleError(error, 'Trend analysis');
    }
  });

// 解析命令行参数
program.parse();