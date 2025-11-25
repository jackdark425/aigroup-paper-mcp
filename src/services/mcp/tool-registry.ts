import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../core/logger.js';

// 导入配置
import {
  searchPapersConfig,
  fetchPaperConfig,
  fetchLatestConfig,
  listCategoriesConfig,
  advancedSearchConfig,
  trendAnalysisConfig,
  cacheManagementConfig,
  smartCacheSearchConfig
} from './tools/configs/index.js';

// 导入处理器
import {
  handleSearchPapers,
  handleFetchPaper,
  handleFetchLatest,
  handleListCategories,
  handleAdvancedSearch,
  handleTrendAnalysis,
  handleCacheManagement,
  handleSmartCacheSearch
} from './tools/handlers/index.js';

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
    this.registerCacheManagementTool();
    this.registerSmartCacheSearchTool();
    
    this.logger.info(`已注册 ${this.toolHandles.size} 个工具`);
  }

  /**
   * 注册搜索论文工具
   */
  private registerSearchPapersTool(): void {
    const tool = this.server.registerTool(
      searchPapersConfig.name,
      {
        title: searchPapersConfig.title,
        description: searchPapersConfig.description,
        inputSchema: searchPapersConfig.inputSchema,
        outputSchema: searchPapersConfig.outputSchema
      },
      handleSearchPapers
    );
    this.toolHandles.set(searchPapersConfig.name, tool);
  }

  /**
   * 注册获取论文详情工具
   */
  private registerFetchPaperTool(): void {
    const tool = this.server.registerTool(
      fetchPaperConfig.name,
      {
        title: fetchPaperConfig.title,
        description: fetchPaperConfig.description,
        inputSchema: fetchPaperConfig.inputSchema,
        outputSchema: fetchPaperConfig.outputSchema
      },
      handleFetchPaper
    );
    this.toolHandles.set(fetchPaperConfig.name, tool);
  }

  /**
   * 注册获取最新论文工具
   */
  private registerFetchLatestTool(): void {
    const tool = this.server.registerTool(
      fetchLatestConfig.name,
      {
        title: fetchLatestConfig.title,
        description: fetchLatestConfig.description,
        inputSchema: fetchLatestConfig.inputSchema,
        outputSchema: fetchLatestConfig.outputSchema
      },
      handleFetchLatest
    );
    this.toolHandles.set(fetchLatestConfig.name, tool);
  }

  /**
   * 注册列出类别工具
   */
  private registerListCategoriesTool(): void {
    const tool = this.server.registerTool(
      listCategoriesConfig.name,
      {
        title: listCategoriesConfig.title,
        description: listCategoriesConfig.description,
        inputSchema: listCategoriesConfig.inputSchema,
        outputSchema: listCategoriesConfig.outputSchema
      },
      handleListCategories
    );
    this.toolHandles.set(listCategoriesConfig.name, tool);
  }

  /**
   * 注册高级搜索工具
   */
  private registerAdvancedSearchTool(): void {
    const tool = this.server.registerTool(
      advancedSearchConfig.name,
      {
        title: advancedSearchConfig.title,
        description: advancedSearchConfig.description,
        inputSchema: advancedSearchConfig.inputSchema,
        outputSchema: advancedSearchConfig.outputSchema
      },
      handleAdvancedSearch
    );
    this.toolHandles.set(advancedSearchConfig.name, tool);
  }

  /**
   * 注册趋势分析工具
   */
  private registerTrendAnalysisTool(): void {
    const tool = this.server.registerTool(
      trendAnalysisConfig.name,
      {
        title: trendAnalysisConfig.title,
        description: trendAnalysisConfig.description,
        inputSchema: trendAnalysisConfig.inputSchema,
        outputSchema: trendAnalysisConfig.outputSchema
      },
      handleTrendAnalysis
    );
    this.toolHandles.set(trendAnalysisConfig.name, tool);
  }

  /**
   * 注册缓存管理工具
   */
  private registerCacheManagementTool(): void {
    const tool = this.server.registerTool(
      cacheManagementConfig.name,
      {
        title: cacheManagementConfig.title,
        description: cacheManagementConfig.description,
        inputSchema: cacheManagementConfig.inputSchema,
        outputSchema: cacheManagementConfig.outputSchema
      },
      handleCacheManagement
    );
    this.toolHandles.set(cacheManagementConfig.name, tool);
  }

  /**
   * 注册智能缓存搜索工具
   */
  private registerSmartCacheSearchTool(): void {
    const tool = this.server.registerTool(
      smartCacheSearchConfig.name,
      {
        title: smartCacheSearchConfig.title,
        description: smartCacheSearchConfig.description,
        inputSchema: smartCacheSearchConfig.inputSchema,
        outputSchema: smartCacheSearchConfig.outputSchema
      },
      handleSmartCacheSearch
    );
    this.toolHandles.set(smartCacheSearchConfig.name, tool);
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