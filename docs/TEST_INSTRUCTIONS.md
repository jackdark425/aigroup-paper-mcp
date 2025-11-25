# MCP工具测试说明

## 问题说明

当前Roo连接的 `aigroup-paper-mcp` MCP服务器实例仍然是旧版本（v0.3.0或更早），需要重新连接才能使用新发布的v0.3.2版本。

## 解决方案

### 方案1：重启Roo并重新连接MCP服务器（推荐）

1. 完全关闭并重启Roo
2. MCP服务器会自动使用最新发布的版本（v0.3.2）
3. 然后可以正常测试所有工具

### 方案2：手动测试新版本

使用命令行直接运行最新版本：

```bash
# 安装最新版本
npm install -g aigroup-paper-mcp@latest

# 或直接使用npx运行
npx aigroup-paper-mcp@latest
```

### 方案3：本地开发测试

使用本地构建的版本：

```bash
# 在项目目录下
node dist/server.js
```

## 验证修复

重新连接后，应该可以成功执行以下MCP调用：

### 测试1: list_categories（应该正常）
```json
{
  "server_name": "aigroup-paper-mcp",
  "tool_name": "list_categories",
  "arguments": {
    "source": "arxiv"
  }
}
```
**预期**: 返回arXiv的类别列表

### 测试2: fetch_latest 不提供category（应该正常）
```json
{
  "server_name": "aigroup-paper-mcp",
  "tool_name": "fetch_latest",
  "arguments": {
    "source": "arxiv",
    "limit": 3
  }
}
```
**预期**: 成功返回最新论文，不再报错"category Required"

### 测试3: fetch_latest 提供category（应该正常）
```json
{
  "server_name": "aigroup-paper-mcp",
  "tool_name": "fetch_latest",
  "arguments": {
    "source": "arxiv",
    "category": "cs.AI",
    "limit": 5
  }
}
```
**预期**: 返回指定类别的最新论文

### 测试4: search_papers（应该正常）
```json
{
  "server_name": "aigroup-paper-mcp",
  "tool_name": "search_papers",
  "arguments": {
    "query": "machine learning",
    "sources": ["arxiv"],
    "limit": 5
  }
}
```
**预期**: 返回机器学习相关论文

## 已修复的问题

### v0.3.2 (2025-11-25)
- ✅ `fetch_latest` 工具的 category 参数现在真正可选
- ✅ 移除了 completable 覆盖配置导致的参数必需问题
- ✅ 清理了未使用的导入和辅助函数

### v0.3.1 (2025-11-25)
- ✅ 组件化重构，代码从1178行减少到232行
- ✅ 修复所有TypeScript类型错误
- ✅ 统一所有处理器的返回类型

## 当前版本信息

- **最新发布版本**: 0.3.2
- **npm包页面**: https://www.npmjs.com/package/aigroup-paper-mcp
- **发布时间**: 2025-11-25

## 注意事项

1. 确保使用的是最新版本的MCP服务器实例
2. 如果仍然遇到问题，请检查MCP服务器配置文件中的版本号
3. 可以通过 `npm view aigroup-paper-mcp version` 验证npm上的最新版本