# MCP工具组件化架构

本目录包含了MCP（Model Context Protocol）工具的组件化实现。

## 目录结构

```
tools/
├── configs/           # 工具配置定义
│   ├── common.ts     # 通用配置
│   ├── search-papers.config.ts
│   ├── fetch-paper.config.ts
│   ├── fetch-latest.config.ts
│   ├── list-categories.config.ts
│   ├── advanced-search.config.ts
│   ├── trend-analysis.config.ts
│   ├── cache-management.config.ts
│   ├── smart-cache-search.config.ts
│   └── index.ts      # 配置导出
├── handlers/         # 工具处理器
│   ├── types.ts      # 通用类型定义
│   ├── search-papers.handler.ts
│   ├── fetch-paper.handler.ts
│   ├── fetch-latest.handler.ts
│   ├── list-categories.handler.ts
│   ├── advanced-search.handler.ts
│   ├── trend-analysis.handler.ts
│   ├── cache-management.handler.ts
│   ├── smart-cache-search.handler.ts
│   └── index.ts      # 处理器导出
├── schemas/          # 数据Schema定义
│   └── common.ts     # 通用Schema
└── README.md         # 本文档
```

## 架构设计

### 1. 配置层（configs/）

工具配置定义了每个MCP工具的元数据和输入/输出Schema。

**示例：**
```typescript
export const searchPapersConfig = {
  name: 'search_papers',
  title: '学术论文搜索',
  description: '跨多个学术平台搜索论文...',
  inputSchema: {
    query: z.string().describe('搜索查询关键词'),
    // ...其他参数
  },
  outputSchema: searchResultSchema
};
```

### 2. 处理器层（handlers/）

处理器包含具体的业务逻辑，负责处理工具调用并返回结果。

**示例：**
```typescript
export async function handleSearchPapers(args: any): Promise<ToolResponse> {
  try {
    const result = await searchPapers(args);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: mappedResult
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: `错误: ${error.message}` }],
      isError: true
    };
  }
}
```

### 3. Schema层（schemas/）

定义通用的数据结构和验证规则。

**示例：**
```typescript
export const paperSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  // ...其他字段
});
```

## 优势

1. **模块化**：每个工具的配置、处理逻辑和Schema分离，易于维护
2. **可复用**：通用的Schema和类型定义可以在多个工具间共享
3. **可测试**：独立的处理器函数易于单元测试
4. **可扩展**：添加新工具只需创建对应的config和handler文件
5. **类型安全**：完整的TypeScript类型支持

## 添加新工具

1. 在`schemas/common.ts`中定义数据Schema（如果需要）
2. 在`configs/`中创建新的配置文件
3. 在`handlers/`中创建新的处理器文件
4. 在各自的`index.ts`中导出
5. 在`tool-registry.ts`中注册新工具

## 注意事项

- 所有处理器必须返回`ToolResponse`类型
- content中的type必须使用`'text' as const`来确保类型正确
- 工具配置应该包含完整的输入验证和输出Schema
- 错误处理应该统一使用try-catch并返回isError标志