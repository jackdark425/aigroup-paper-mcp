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
    
    // 注册所有组件
    this.setupAll();
    
    this.logger.info('MCP Server initialized with MCP 1.22 features');
  }
  
  /**
   * 设置所有组件
   */
  private setupAll(): void {
    this.toolRegistry.registerAll();
    this.resourceRegistry.registerAll();
    this.promptRegistry.registerAll();
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
      this.logger.info('Drivers initialized');
      
      // 使用stdio传输启动服务器
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('MCP Server started with MCP 1.22 features:');
      this.logger.info('✓ McpServer class');
      this.logger.info('✓ Resources support');
      this.logger.info('✓ Prompts support');
      this.logger.info('✓ Notification debouncing');
      this.logger.info('✓ Dynamic tool management');
      this.logger.info('✓ Display names and metadata');
      this.logger.info('✓ Parameter completions');
    } catch (error) {
      this.logger.error('Failed to start MCP server', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
