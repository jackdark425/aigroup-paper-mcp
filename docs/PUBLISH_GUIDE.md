# NPM 发布指南

## 版本信息
- **当前版本**: 0.3.1
- **发布类型**: Bug修复和代码重构
- **发布日期**: 2025-11-25

## 发布前检查清单

- [x] 代码已通过编译（无TypeScript错误）
- [x] 所有工具测试通过
- [x] 版本号已更新（0.3.0 → 0.3.1）
- [x] CHANGELOG.md 已更新
- [x] 所有新文件已添加到git
- [x] dist目录已重新构建

## 发布步骤

### 1. 登录 npm 账号
```bash
npm login
```

### 2. 发布包
```bash
npm publish
```

### 3. 验证发布
```bash
npm view aigroup-paper-mcp version
```

## 发布内容

### 包含的文件
- `dist/**/*` - 编译后的JavaScript文件
- `LICENSE` - MIT许可证
- `README.md` - 项目文档
- `claude_desktop_config.json` - Claude Desktop配置示例

### 主要改进
1. **Bug修复**
   - fetch_latest工具的category参数问题
   - 输出验证错误
   - TypeScript类型错误

2. **代码重构**
   - 组件化架构
   - 代码量减少78.6%
   - 提升可维护性

3. **新增功能**
   - 完整的模块化工具系统
   - 详细的架构文档
   - 自动化测试脚本

## 发布后

### 1. 创建 Git Tag
```bash
git tag v0.3.1
git push origin v0.3.1
```

### 2. 更新 GitHub Release
在GitHub上创建新的Release，包含CHANGELOG内容

### 3. 通知用户
通过适当渠道通知用户更新版本

## 回滚方案

如果发现问题需要回滚：
```bash
npm unpublish aigroup-paper-mcp@0.3.1
```

注意：npm unpublish只能在发布后24小时内执行。