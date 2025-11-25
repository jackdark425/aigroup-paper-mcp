# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.3] - 2025-11-25

### Fixed
- 修复布尔查询解析器错误 - 复杂嵌套查询（如 `(A OR B) AND (C OR D) NOT (E OR F)`）现在能正确解析
- 修复查询长度验证缺失 - 添加1-2000字符的长度限制，超长查询自动截断
- 修复空查询处理 - 空字符串查询现在返回友好错误而非超时
- 修复趋势分析时间粒度问题 - 自动调整不合理的时间粒度组合（如"all"+"day"）
- 修复增长率计算中的除零错误
- 添加SQL注入防护 - 自动移除分号、SQL注释符等危险字符

### Added
- 新增查询验证和清理函数 `validateAndCleanQuery`
- 新增时间粒度验证函数 `validateTimeGranularity`
- 新增自动粒度调整函数 `adjustGranularityIfNeeded`
- 限制趋势分析最大时间区间数为100

### Improved
- 改进布尔查询解析器的括号处理逻辑
- 优化 `findTopLevelOperator` 函数，正确处理嵌套括号和引号
- 增强输入验证和错误处理
- 提升系统安全性和稳定性

## [0.3.2] - 2025-11-25

### Fixed
- 修复 `fetch_latest` 工具的 category 参数仍然标记为必需的问题
- 移除了 completable 覆盖配置，确保 category 参数真正可选
- 清理了未使用的导入和辅助函数

### Changed
- 简化了 fetch_latest 工具的注册逻辑

## [0.3.1] - 2025-11-25

### Fixed
- 修复 `fetch_latest` 工具的 category 参数验证问题 - category 现在是可选参数
- 修复所有工具的输出验证错误 - 统一使用正确的返回类型格式
- 清理了 tool-registry.ts 中数百行重复的代码

### Changed
- 重构 `tool-registry.ts` 为组件化架构，代码量从 1178 行减少到 252 行（-78.6%）
- 采用三层架构设计：配置层（configs/）、处理器层（handlers/）、Schema层（schemas/）
- 所有工具处理器现在使用统一的 `ToolResponse` 类型接口

### Added
- 新增工具配置模块化文件（8个config文件）
- 新增工具处理器模块化文件（8个handler文件）
- 新增通用Schema定义文件
- 新增架构文档 `src/services/mcp/tools/README.md`
- 新增重构完成报告 `REFACTORING_COMPLETE.md`
- 新增自动化测试脚本 `test-tools.js`

### Improved
- 显著提升代码可维护性和可扩展性
- 完整的 TypeScript 类型支持
- 更清晰的模块边界和职责划分
- 更容易进行单元测试

## [0.3.0] - Previous Release

### Added
- MCP 1.22 SDK 支持
- 8个学术论文搜索工具
- 多平台集成（arXiv, OpenAlex, PMC等）
- 智能缓存系统
- 趋势分析功能