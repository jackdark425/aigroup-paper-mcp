/**
 * MCP工具处理器的返回类型
 */
export interface ToolResponse {
  [x: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  structuredContent?: any;
  isError?: boolean;
}

/**
 * MCP工具处理器函数类型
 */
export type ToolHandler<TArgs = any> = (
  args: TArgs,
  extra?: any
) => Promise<ToolResponse>;