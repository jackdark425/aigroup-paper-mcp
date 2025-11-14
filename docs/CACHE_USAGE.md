# 缓存功能使用指南

## 问题背景

当使用 `fetch_latest` 工具获取大量论文信息时，返回的数据可能会超过大模型的上下文限制（例如Claude的200K token限制）。为了解决这个问题，我们实现了以下功能：

## 解决方案

### 1. 数据缓存

数据会自动缓存到本地文件 `./cache/data.json`，避免重复API调用：

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 1,
  "useCache": true,
  "cacheTtl": 3600
}
```

**优点**：
- ✅ 提升性能（缓存命中时速度提升100%）
- ✅ 减少API调用次数
- ❌ **但仍会将完整数据返回给大模型**

### 2. 保存到文件（推荐用于大批量数据）

当数据量很大时，应该使用 `saveToFile` 参数将完整数据保存到文件，同时配合 `summaryOnly` 参数只返回摘要给大模型：

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 100,
  "saveToFile": true,
  "outputPath": "./output/papers.json",
  "summaryOnly": true
}
```

**这样做的效果**：
- ✅ 完整数据保存在 `./output/papers.json` 文件中
- ✅ 只返回精简的摘要信息给大模型
- ✅ 避免上下文超限

### 3. 限制响应大小

使用 `maxResponseSize` 参数限制返回数据的字符数：

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 100,
  "maxResponseSize": 50000,
  "saveToFile": true
}
```

**效果**：
- ✅ 自动截断超过限制的数据
- ✅ 完整数据仍保存在缓存/文件中
- ⚠️  可能只返回部分论文

### 4. 只返回摘要

使用 `summaryOnly` 参数只返回精简信息：

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 100,
  "summaryOnly": true
}
```

**返回的摘要信息包含**：
- 论文ID
- 标题
- 前3个作者
- 发布日期
- 来源平台
- 引用次数
- 摘要前200字符

## 最佳实践

### 场景1：快速浏览最新论文

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 10,
  "summaryOnly": true
}
```

### 场景2：获取大批量数据用于后续分析

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 100,
  "saveToFile": true,
  "outputPath": "./data/latest_papers.json",
  "summaryOnly": true,
  "useCache": true
}
```

**工作流程**：
1. 调用工具时，完整数据保存到 `./data/latest_papers.json`
2. 大模型只收到精简摘要（避免上下文超限）
3. 后续可以读取文件进行详细分析

### 场景3：定期更新数据

```json
{
  "source": "medrxiv",
  "category": "infectious-diseases",
  "limit": 50,
  "useCache": true,
  "cacheTtl": 1800,
  "saveToFile": true,
  "summaryOnly": true
}
```

**特点**：
- 30分钟内重复请求使用缓存
- 数据自动保存到文件
- 只返回摘要给大模型

## CLI 使用示例

```bash
# 获取最新论文并保存到文件
node dist/cli.js latest \
  -s med
rxiv \
  -c infectious-diseases \
  -l 100 \
  --save-to-file \
  --summary-only \
  --output-path ./output/latest.json

# 禁用缓存获取最新数据
node dist/cli.js latest \
  -s medrxiv \
  -c infectious-diseases \
  -l 10 \
  --no-cache \
  --summary-only

# 限制响应大小
node dist/cli.js latest \
  -s medrxiv \
  -c infectious-diseases \
  -l 100 \
  --max-response-size 50000 \
  --save-to-file
```

## 数据存储位置

- **缓存文件**: `./cache/data.json`
- **输出文件**: 默认 `./output/latest_{source}_{category}_{timestamp}.json`
- **自定义输出**: 通过 `outputPath` 参数指定

## 常见问题

### Q: 为什么设置了 saveToFile 还是返回大量数据给大模型？

A: 需要同时设置 `summaryOnly: true` 或 `maxResponseSize`，否则完整数据仍会返回。推荐的做法：

```json
{
  "saveToFile": true,
  "summaryOnly": true  // 关键参数
}
```

### Q: 缓存数据会自动更新吗？

A: 缓存有TTL（默认30分钟），过期后会自动从API重新获取。可通过 `cacheTtl` 参数自定义。

### Q: 如何查看完整的论文详情？

A: 方法1：读取保存的JSON文件
方法2：使用 `fetch_paper` 工具查询特定论文
方法3：设置 `summaryOnly: false`（小批量数据时）

## 总结

要避免大模型上下文超限，**最重要的是组合使用以下参数**：

```json
{
  "saveToFile": true,      // 保存完整数据到文件
  "summaryOnly": true,     // 只返回摘要给大模型
  "useCache": true         // 启用缓存提升性能 
}
```

这样既能保存完整数据供后续使用，又不会超过大模型的上下文限制。