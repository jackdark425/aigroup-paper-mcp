# 🚨 快速修复：MCP工具验证失败

## 问题
在其他终端调用aigroup-paper-mcp时，所有工具都返回验证错误。

## 🎯 一键修复（推荐）

复制并运行以下命令：

### Windows PowerShell
```powershell
# 清除缓存、重装最新版本
npm cache clean --force; npm uninstall -g aigroup-paper-mcp; npm install -g aigroup-paper-mcp@0.3.5; npx aigroup-paper-mcp@0.3.5
```

### macOS/Linux
```bash
# 清除缓存、重装最新版本
npm cache clean --force && npm uninstall -g aigroup-paper-mcp && npm install -g aigroup-paper-mcp@0.3.5 && npx aigroup-paper-mcp@0.3.5
```

## ✅ 验证修复

运行后应该看到：
```
MCP Server 已启动，功能特性:
✓ McpServer 类支持
✓ Resources 资源支持
...
```

## 🔄 如果还是不行

### 方案1: 使用本地开发版本

编辑你的MCP客户端配置文件（如`claude_desktop_config.json`）：

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

### 方案2: 强制使用npx最新版本

```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "--package=aigroup-paper-mcp@0.3.5",
        "aigroup-paper-mcp"
      ]
    }
  }
}
```

### 方案3: 完全重置

```bash
# 1. 停止所有MCP服务
# 2. 清除所有缓存
npm cache clean --force
rm -rf ~/.npm

# 3. 重新安装
npm install -g aigroup-paper-mcp@0.3.5

# 4. 重启MCP客户端
```

## 📋 检查清单

- [ ] npm版本 >= 8.0 (`npm --version`)
- [ ] Node版本 >= 18.0 (`node --version`)
- [ ] 已清除npm缓存
- [ ] 已卸载旧版本
- [ ] 已安装0.3.5版本
- [ ] 已重启MCP客户端
- [ ] 配置文件路径正确

## 🐛 仍然失败？

请检查：

1. **是否使用了代理？** 
   - 尝试关闭VPN/代理
   - 设置npm镜像：`npm config set registry https://registry.npmmirror.com`

2. **权限问题？**
   - Windows: 以管理员身份运行PowerShell
   - macOS/Linux: 使用 `sudo npm install -g`

3. **多个Node版本？**
   - 检查：`which node` / `where node`
   - 使用nvm切换到单一版本

## 💡 为什么Roo环境能用？

Roo使用的配置：
```json
{
  "command": "node",
  "args": ["d:/aigroup-paper-mcp/dist/server.js"]
}
```

这直接指向本地开发目录，不受npm缓存影响。

## 📞 需要帮助？

如果以上都不行，请提供：
```bash
# 运行这些命令并发送输出
node --version
npm --version
npm list -g aigroup-paper-mcp
npm cache verify
```

详细故障排除：查看 `docs/TROUBLESHOOTING.md`