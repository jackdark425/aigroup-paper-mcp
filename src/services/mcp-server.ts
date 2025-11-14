import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from '../core/logger.js';
import { config } from '../config/index.js';
import { initializeDrivers } from '../drivers/index.js';
import { ToolRegistry } from './mcp/tool-registry.js';
import { ResourceRegistry } from './mcp/resource-registry.js';
import { PromptRegistry } from './mcp/prompt-registry.js';

/**
 * MCP服务器主类
 * 协调工具、资源和提示词的注册
 */
export class MCPServer {
  private server: McpServer;
  private logger: Logger;
  private toolRegistry: ToolRegistry;
  private resourceRegistry: ResourceRegistry;
  private promptRegistry: PromptRegistry;
  
  constructor() {
    this.logger = new Logger('MCPServer');
    
    // 使用McpServer类，启用通知去抖动
    this.server = new McpServer(
      {
        name: config.server.name,
        version: config.server.version
      },
      {
        // 启用通知去抖动以提高网络效率
        debouncedNotificationMethods: [
          'notifications/tools/list_changed',
          'notifications/resources/list_changed',
          'notifications/prompts/list_changed'
        ]
      }
    );
    
    // 初始化注册器
    this.toolRegistry = new ToolRegistry(this.server);
    this.resourceRegistry = new ResourceRegistry(this.server);
    this.promptRegistry = new PromptRegistry(this.server);
    
    this.logger.info('MCP Server initialized with MCP 1.22 features');
  }
  
  /**
   * 设置所有组件
   */
  private setupAll(): void {
    this.logger.info('开始注册工具、资源和提示词...');
    this.toolRegistry.registerAll();
    this.resourceRegistry.registerAll();
    this.promptRegistry.registerAll();
    this.logger.info('所有组件注册完成');
  }
  
  /**
   * 启用工具
   */
  public enableTool(toolName: string): void {
    this.toolRegistry.enableTool(toolName);
  }

  /**
   * 禁用工具
   */
  public disableTool(toolName: string): void {
    this.toolRegistry.disableTool(toolName);
  }

  /**
   * 移除工具
   */
  public removeTool(toolName: string): void {
    this.toolRegistry.removeTool(toolName);
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 初始化驱动
      initializeDrivers();
      this.logger.info('驱动已初始化');
      
      // 注册所有组件（必须在连接前完成）
      this.setupAll();
      
      // 使用stdio传输启动服务器
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('MCP Server 已启动，功能特性:');
      this.logger.info('✓ McpServer 类支持');
      this.logger.info('✓ Resources 资源支持');
      this.logger.info('✓ Prompts 提示词支持');
      this.logger.info('✓ 通知去抖动');
      this.logger.info('✓ 动态工具管理');
      this.logger.info('✓ 显示名称和元数据');
      this.logger.info('✓ 参数自动补全');
    } catch (error) {
      this.logger.error('启动MCP服务器失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
