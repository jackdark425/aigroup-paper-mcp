import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { Logger } from '../../core/logger.js';
import { searchPapers, fetchPaper, fetchLatest, listCategories, advancedSearch, analyzeTrends } from '../../tools/index.js';
import { PlatformSource, SearchField, SortField, SortOrder } from '../../types/index.js';

/**
 * MCP工具注册器
 * 负责注册所有MCP工具
 */
export class ToolRegistry {
  private logger: Logger;
  private toolHandles: Map<string, any> = new Map();

  constructor(private server: McpServer) {
    this.logger = new Logger('ToolRegistry');
  }

  /**
   * 注册所有工具
   */
  registerAll(): void {
    this.registerSearchPapersTool();
    this.registerFetchPaperTool();
    this.registerFetchLatestTool();
    this.registerListCategoriesTool();
    this.registerAdvancedSearchTool();
    this.registerTrendAnalysisTool();
    
    this.logger.info(`已注册 ${this.toolHandles.size} 个工具`);
  }

  /**
   * 注册搜索论文工具
   */
  private registerSearchPapersTool(): void {
    const tool = this.server.registerTool(
      'search_papers',
      {
        title: '学术论文搜索',
        description: '跨多个学术平台搜索论文（arXiv、OpenAlex等）。支持多字段搜索、过滤和排序。',
        inputSchema: {
          query: z.string().describe('搜索查询关键词。系统会自动优化和纠正拼写错误。'),
          sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要搜索的特定平台。'),
          field: completable(
            z.nativeEnum(SearchField).optional(),
            (value) => {
              const fields = Object.values(SearchField);
              return Promise.resolve(
                fields.filter(f => f.toLowerCase().startsWith((value || '').toLowerCase()))
              );
            }
          ).describe('搜索字段：全部、标题、摘要、作者、关键词、全文。'),
          categories: z.array(z.string()).optional().describe('按类别/主题过滤。'),
          sortBy: z.nativeEnum(SortField).optional().describe('排序字段'),
          sortOrder: z.nativeEnum(SortOrder).optional().describe('排序顺序'),
          limit: z.number().optional().describe('每个平台的最大结果数（默认：10，最大：100）'),
          offset: z.number().optional().describe('分页偏移量（默认：0）')
        },
        outputSchema: {
          results: z.array(z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()),
            abstract: z.string().optional(),
            published: z.string().optional(),
            source: z.string(),
            citations: z.number().optional(),
            url: z.string().optional()
          })),
          total: z.number(),
          sources: z.array(z.string())
        }
      },
      async (args) => {
        try {
          const toolArgs = {
            query: args.query,
            sources: args.sources,
            field: args.field,
            categories: args.categories,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
            limit: args.limit || 10,
            offset: args.offset || 0,
            enableSmartSuggestions: true,
            enableEnhancement: true,
            enableSearchStrategy: true
          };
          
          const result = await searchPapers(toolArgs);
          
          // 映射返回值到 outputSchema 期望的结构
          const mappedResult = {
            results: result.papers.map(paper => ({
              id: paper.id,
              title: paper.title,
              authors: paper.authors.map(a => a.name),
              abstract: paper.abstract || undefined,
              published: paper.publishedDate?.toISOString() || undefined,
              source: paper.source,
              citations: paper.citationCount || undefined,
              url: paper.urls?.landing || paper.urls?.abstract || undefined
            })),
            total: result.total,
            sources: Object.keys(result.totalBySource)
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`搜索论文失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('search_papers', tool);
  }

  /**
   * 注册获取论文详情工具
   */
  private registerFetchPaperTool(): void {
    const tool = this.server.registerTool(
      'fetch_paper',
      {
        title: '获取论文详情',
        description: '从指定平台根据ID获取论文的详细信息。返回完整的元数据。',
        inputSchema: {
          id: z.string().describe('平台特定格式的论文ID'),
          source: z.nativeEnum(PlatformSource).describe('论文所在平台源')
        },
        outputSchema: {
          paper: z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()),
            abstract: z.string().optional(),
            published: z.string().optional(),
            source: z.string(),
            citations: z.number().optional(),
            url: z.string().optional()
          })
        }
      },
      async (args) => {
        try {
          const paper = await fetchPaper(args);
          
          // 映射返回值到 outputSchema 期望的结构
          const mappedResult = {
            paper: {
              id: paper.id,
              title: paper.title,
              authors: paper.authors.map(a => a.name),
              abstract: paper.abstract || undefined,
              published: paper.publishedDate?.toISOString() || undefined,
              source: paper.source,
              citations: paper.citationCount || undefined,
              url: paper.urls?.landing || paper.urls?.abstract || undefined
            }
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(paper, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`获取论文失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('fetch_paper', tool);
  }

  /**
   * 注册获取最新论文工具
   */
  private registerFetchLatestTool(): void {
    const tool = this.server.registerTool(
      'fetch_latest',
      {
        title: '获取最新论文',
        description: '从特定类别的平台获取最新论文。具有智能缓存和摘要模式功能。',
        inputSchema: {
          source: z.nativeEnum(PlatformSource).describe('要获取的平台源'),
          category: completable(
            z.string(),
            async (value, context) => {
              if (context?.arguments?.source) {
                const source = context.arguments.source as PlatformSource;
                const categories = await this.getCategoriesForSource(source);
                return categories.filter((c: string) => c.toLowerCase().includes(value.toLowerCase()));
              }
              return [];
            }
          ).describe('要获取的类别/主题'),
          limit: z.number().optional().describe('要获取的最大论文数（默认：10，最大：50）'),
          useCache: z.boolean().optional().describe('是否使用缓存（默认：true）'),
          summaryOnly: z.boolean().optional().describe('仅返回摘要信息'),
          enableEnhancement: z.boolean().optional().describe('启用结果增强（默认：true）')
        },
        outputSchema: {
          papers: z.array(z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()),
            abstract: z.string().optional(),
            published: z.string().optional(),
            source: z.string()
          })),
          total: z.number(),
          category: z.string()
        }
      },
      async (args) => {
        try {
          const toolArgs = {
            source: args.source,
            category: args.category,
            limit: args.limit || 10,
            useCache: args.useCache ?? true,
            summaryOnly: args.summaryOnly ?? false,
            enableEnhancement: args.enableEnhancement ?? true,
            saveToFile: false
          };
          
          const result = await fetchLatest(toolArgs);
          
          // 映射返回值到 outputSchema 期望的结构
          // 处理可能的不同返回类型（包括缓存返回）
          const papers = (result as any).papers || [];
          const count = (result as any).count || (result as any).total || 0;
          const category = (result as any).category || args.category;
          
          const mappedResult = {
            papers: papers.map((paper: any) => ({
              id: paper.id,
              title: paper.title,
              authors: Array.isArray(paper.authors)
                ? paper.authors.map((a: any) => typeof a === 'string' ? a : a.name)
                : [],
              abstract: paper.abstract || undefined,
              published: paper.publishedDate?.toISOString?.() || paper.publishedDate || undefined,
              source: paper.source
            })),
            total: count,
            category: category
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`获取最新论文失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('fetch_latest', tool);
  }

  /**
   * 注册列出类别工具
   */
  private registerListCategoriesTool(): void {
    const tool = this.server.registerTool(
      'list_categories',
      {
        title: '列出平台类别',
        description: '列出一个或所有平台的可用类别/主题。',
        inputSchema: {
          source: z.nativeEnum(PlatformSource).optional().describe('平台源（留空则列出所有平台的类别）')
        },
        outputSchema: {
          categories: z.array(z.object({
            source: z.string(),
            category: z.string(),
            description: z.string().optional(),
            paperCount: z.number().optional()
          }))
        }
      },
      async (args) => {
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
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`列出类别失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('list_categories', tool);
  }

  /**
   * 注册高级搜索工具
   */
  private registerAdvancedSearchTool(): void {
    const tool = this.server.registerTool(
      'advanced_search',
      {
        title: '高级搜索',
        description: '具有布尔运算符（AND、OR、NOT）、模糊匹配和精确匹配功能的高级搜索。',
        inputSchema: {
          query: z.string().describe('带有布尔运算符的搜索查询'),
          sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要搜索的特定平台'),
          field: z.nativeEnum(SearchField).optional().describe('搜索字段'),
          fuzzyMatch: z.boolean().optional().describe('启用模糊匹配（默认：false）'),
          exactMatch: z.boolean().optional().describe('启用精确匹配（默认：false）'),
          limit: z.number().optional().describe('每个平台的最大结果数（默认：10）'),
          offset: z.number().optional().describe('分页偏移量（默认：0）')
        },
        outputSchema: {
          results: z.array(z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()),
            relevance: z.number().optional()
          })),
          total: z.number()
        }
      },
      async (args) => {
        try {
          const toolArgs = {
            query: args.query,
            sources: args.sources,
            field: args.field,
            fuzzyMatch: args.fuzzyMatch ?? false,
            exactMatch: args.exactMatch ?? false,
            caseSensitive: false,
            limit: args.limit || 10,
            offset: args.offset || 0
          };
          
          const result = await advancedSearch(toolArgs);
          
          // 映射返回值到 outputSchema 期望的结构
          const mappedResult = {
            results: result.papers.map((paper: any) => ({
              id: paper.id,
              title: paper.title,
              authors: paper.authors.map((a: any) => a.name || a),
              relevance: paper.enhancedMetadata?.impactScore || undefined
            })),
            total: result.total
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`高级搜索失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('advanced_search', tool);
  }

  /**
   * 注册趋势分析工具
   */
  private registerTrendAnalysisTool(): void {
    const tool = this.server.registerTool(
      'trend_analysis',
      {
        title: '研究趋势分析',
        description: '分析特定主题随时间的变化趋势，包括增长率、高峰期和关键词分析。',
        inputSchema: {
          topic: z.string().describe('要分析趋势的主题'),
          sources: z.array(z.nativeEnum(PlatformSource)).optional().describe('要分析的平台源'),
          period: z.enum(['week', 'month', 'year', 'all']).optional().describe('分析时间段'),
          granularity: z.enum(['day', 'week', 'month']).optional().describe('时间粒度'),
          limit: z.number().optional().describe('每个时间段要分析的最大论文数')
        },
        outputSchema: {
          trends: z.array(z.object({
            period: z.string(),
            paperCount: z.number(),
            growthRate: z.number().optional(),
            topKeywords: z.array(z.string())
          })),
          topic: z.string(),
          totalPapers: z.number()
        }
      },
      async (args) => {
        try {
          const toolArgs = {
            topic: args.topic,
            sources: args.sources,
            period: args.period || 'year',
            granularity: args.granularity || 'month',
            limit: args.limit || 100,
            useCache: true,
            timeout: 45000
          };
          
          const result = await analyzeTrends(toolArgs);
          
          // 映射返回值到 outputSchema 期望的结构
          const mappedResult = {
            trends: result.dataPoints.map(dp => ({
              period: dp.period,
              paperCount: dp.count,
              growthRate: result.growthRate,
              topKeywords: dp.topKeywords || []
            })),
            topic: result.topic,
            totalPapers: result.totalPapers
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            structuredContent: mappedResult
          };
        } catch (error: any) {
          this.logger.error(`趋势分析失败: ${error.message}`);
          return {
            content: [
              {
                type: 'text',
                text: `错误: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
    this.toolHandles.set('trend_analysis', tool);
  }

  /**
   * 辅助方法：获取平台的类别
   */
  private async getCategoriesForSource(source: PlatformSource): Promise<string[]> {
    try {
      const result = await listCategories({ source });
      return result.platforms[0]?.categories.map((c: any) => c.category || c) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 启用工具
   */
  enableTool(toolName: string): void {
    const tool = this.toolHandles.get(toolName);
    if (tool) {
      tool.enable();
      this.logger.info(`工具已启用: ${toolName}`);
    }
  }

  /**
   * 禁用工具
   */
  disableTool(toolName: string): void {
    const tool = this.toolHandles.get(toolName);
    if (tool) {
      tool.disable();
      this.logger.info(`工具已禁用: ${toolName}`);
    }
  }

  /**
   * 移除工具
   */
  removeTool(toolName: string): void {
    const tool = this.toolHandles.get(toolName);
    if (tool) {
      tool.remove();
      this.toolHandles.delete(toolName);
      this.logger.info(`工具已移除: ${toolName}`);
    }
  }

  /**
   * 获取所有工具句柄
   */
  getToolHandles(): Map<string, any> {
    return this.toolHandles;
  }
}