import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../core/logger.js';
import { fetchPaper, fetchLatest, searchPapers } from '../../tools/index.js';
import { PlatformSource } from '../../types/index.js';

/**
 * MCP资源注册器
 * 负责注册所有MCP资源
 */
export class ResourceRegistry {
  private logger: Logger;

  constructor(private server: McpServer) {
    this.logger = new Logger('ResourceRegistry');
  }

  /**
   * 注册所有资源
   */
  registerAll(): void {
    this.registerPaperResource();
    this.registerCategoryResource();
    this.registerSearchResource();
    
    this.logger.info('已注册 3 个资源模板');
  }

  /**
   * 注册论文资源模板
   */
  private registerPaperResource(): void {
    this.server.registerResource(
      'paper',
      new ResourceTemplate('paper://{source}/{id}', { list: undefined }),
      {
        title: '学术论文',
        description: '来自各种学术平台的论文内容和元数据'
      },
      async (uri, { source, id }) => {
        try {
          const paper = await fetchPaper({ 
            source: source as PlatformSource, 
            id: id as string 
          });
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify(paper, null, 2),
                mimeType: 'application/json'
              }
            ]
          };
        } catch (error: any) {
          this.logger.error(`资源获取失败: ${error.message}`);
          throw error;
        }
      }
    );
  }

  /**
   * 注册类别资源模板
   */
  private registerCategoryResource(): void {
    this.server.registerResource(
      'category',
      new ResourceTemplate('category://{source}/{category}', { list: undefined }),
      {
        title: '论文类别',
        description: '特定平台和类别的论文列表'
      },
      async (uri, { source, category }) => {
        try {
          const papers = await fetchLatest({ 
            source: source as PlatformSource, 
            category: category as string, 
            limit: 20,
            useCache: true,
            enableEnhancement: true,
            saveToFile: false
          });
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify(papers, null, 2),
                mimeType: 'application/json'
              }
            ]
          };
        } catch (error: any) {
          this.logger.error(`类别资源获取失败: ${error.message}`);
          throw error;
        }
      }
    );
  }

  /**
   * 注册搜索结果资源
   */
  private registerSearchResource(): void {
    this.server.registerResource(
      'search',
      new ResourceTemplate('search://{query}', { list: undefined }),
      {
        title: '搜索结果',
        description: '特定查询的学术论文搜索结果'
      },
      async (uri, { query }) => {
        try {
          const results = await searchPapers({
            query: query as string,
            limit: 20,
            enableSmartSuggestions: true,
            enableEnhancement: true,
            enableSearchStrategy: true
          });
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify(results, null, 2),
                mimeType: 'application/json'
              }
            ]
          };
        } catch (error: any) {
          this.logger.error(`搜索资源失败: ${error.message}`);
          throw error;
        }
      }
    );
  }
}