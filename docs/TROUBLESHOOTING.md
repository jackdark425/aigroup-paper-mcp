# aigroup-paper-mcp 故障排除指南

## 问题：在其他终端调用MCP工具时输出验证失败

### 症状
- `list_categories`: 输出验证失败
- `fetch_latest`: 参数验证问题  
- `advanced_search`: 输出验证失败
- 所有工具调用都返回验证错误

### 根本原因
MCP客户端缓存了旧版本的工具定义或服务器代码。

## 🔧 解决方案

### 方案1: 清除npm缓存并重新安装（推荐）

```bash
# 1. 清除npm缓存
npm cache clean --force

# 2. 卸载旧版本
npm uninstall -g aigroup-paper-mcp

# 3. 安装最新版本
npm install -g aigroup-paper-mcp@latest

# 4. 验证版本
npx aigroup-paper-mcp --version
```

### 方案2: 使用npx强制使用最新版本

```bash
# 不要使用全局安装，直接用npx
npx --yes aigroup-paper-mcp@latest
```

### 方案3: 清除MCP客户端缓存

如果使用Claude Desktop或其他MCP客户端：

**Windows:**
```powershell
# 删除Claude Desktop配置缓存
Remove-Item -Path "$env:APPDATA\Claude\*" -Recurse -Force

# 重启Claude Desktop
```

**macOS/Linux:**
```bash
# 删除Claude Desktop配置缓存
rm -rf ~/Library/Application\ Support/Claude/*

# 重启Claude Desktop
```

### 方案4: 修改MCP客户端配置

确保配置文件使用最新版本：

**claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "aigroup-paper-mcp@0.3.5"
      ]
    }
  }
}
```

或使用本地开发版本：
```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "node",
      "args": [
        "D:/aigroup-paper-mcp/dist/server.js"
      ]
    }
  }
}
```

## 验证修复

### 1. 检查版本
```bash
npx aigroup-paper-mcp@latest --version
```
应该输出: `0.3.5` 或更高

### 2. 测试工具
在MCP客户端中运行：

```javascript
// 测试 fetch_paper
use_mcp_tool("aigroup-paper-mcp", "fetch_paper", {
  "id": "2301.00001",
  "source": "arxiv"
})

// 期望结果：authors 应该是字符串数组
// ✅ ["Jordan Thompson", "Ryan Benac", ...]
// ❌ [{"name": "Jordan Thompson"}, ...]
```

### 3. 检查日志

启用详细日志查看具体错误：

**Windows PowerShell:**
```powershell
$env:DEBUG="*"
npx aigroup-paper-mcp@latest
```

**macOS/Linux:**
```bash
DEBUG=* npx aigroup-paper-mcp@latest
```

## 常见问题

### Q: 为什么本地测试成功但其他终端失败？

**A:** 本地测试使用的是开发环境的最新代码，而其他终端可能使用的是：
- 缓存的旧版本
- 全局安装的过时版本
- 不同的MCP客户端版本

### Q: 如何确保使用最新版本？

**A:** 
1. 始终使用 `npx aigroup-paper-mcp@latest` 而不是全局安装
2. 在配置文件中指定明确的版本号
3. 定期运行 `npm cache clean --force`

### Q: 输出验证错误的真正原因是什么？

**A:** 
1. **Schema不匹配**: 旧版本返回 `authors: [{name: "..."}]`，新版本返回 `authors: ["..."]`
2. **必需字段缺失**: 旧版本可能返回 `undefined`，违反Schema要求
3. **类型错误**: 字段类型与Schema定义不符

### Q: 为什么在Roo环境中能工作？

**A:** Roo环境可能：
1. 使用的是本地开发版本（`d:\aigroup-paper-mcp`）
2. 配置指向本地构建的dist目录
3. 不受npm缓存影响

## 最佳实践

### 开发环境
```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "node",
      "args": ["d:/aigroup-paper-mcp/dist/server.js"]
    }
  }
}
```

### 生产环境
```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-paper-mcp@latest"]
    }
  }
}
```

## 紧急修复步骤

如果上述方法都不行，执行完整重置：

```bash
# 1. 完全清除
npm cache clean --force
npm uninstall -g aigroup-paper-mcp

# 2. 删除node_modules（如果有本地安装）
rm -rf node_modules package-lock.json

# 3. 清除MCP客户端数据
# Windows: 删除 %APPDATA%\Claude\
# macOS: 删除 ~/Library/Application Support/Claude/

# 4. 重新安装
npm install -g aigroup-paper-mcp@0.3.5

# 5. 重启MCP客户端
```

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 操作系统和版本
2. Node.js版本 (`node --version`)
3. npm版本 (`npm --version`)
4. MCP客户端类型和版本
5. 完整错误日志
6. 配置文件内容

GitHub Issues: https://github.com/your-repo/aigroup-paper-mcp/issues