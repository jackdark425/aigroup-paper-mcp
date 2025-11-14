# AIGROUP Paper MCP Server

一个统一的学术论文搜索和检索MCP服务器，集成了12+个学术平台。

### 🔧 高级工具 (6个)
- ✅ **智能参数完成** - 实时建议和上下文感知
- ✅ **显示名称支持** - 更好的UI呈现
- ✅ **结构化内容** - 原生支持结构化数据
- ✅ **动态工具管理** - 运行时启用/禁用工具

### 📚 资源系统 (3个)
- `paper://{source}/{id}` - 直接访问论文元数据
- `category://{source}/{category}` - 浏览类别论文
- `search://{query}` - 搜索结果作为资源

### 💬 提示模板 (3个)
- `literature_review` - 文献综述助手
- `research_gap_analysis` - 研究差距分析
- `paper_comparison` - 论文比较分析

### ⚡ 性能优化
- ✅ **通知去抖动** - 减少网络流量
- ✅ **智能缓存** - 更快的响应速度
- ✅ **并行搜索** - 多平台同时查询

## 🚀 快速开始

### 安装

#### 作为CLI工具使用 (npx)
```bash
# 直接运行
npx aigroup-paper-mcp --help

# 搜索论文
npx aigroup-paper-mcp search "machine learning"

# 获取论文详情
npx aigroup-paper-mcp fetch "2301.00001" --source arxiv

# 列出平台类别
npx aigroup-paper-mcp categories
```

#### 作为MCP服务器使用
```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 运行

```bash
npm start
```

## 📖 支持的平台

- arXiv - 物理、数学、计算机科学等
- OpenAlex - 综合学术数据库
- PubMed Central (PMC) - 生物医学文献
- Europe PMC - 欧洲生物医学数据库
- bioRxiv - 生物学预印本
- medRxiv - 医学预印本
- CORE - 开放获取研究论文
- Semantic Scholar - AI驱动的学术搜索
- Crossref - DOI和元数据服务
- PubMed - 生物医学文献数据库
- Google Scholar - 学术搜索引擎
- IACR - 密码学研究

## 🛠️ 工具列表

### 1. search_papers - 学术论文搜索
跨多个平台搜索论文，智能平台选择和查询优化。

**参数：**
- `query` - 搜索关键词（必需，带智能纠错）
- `sources` - 平台列表（可选，留空智能选择）
- `field` - 搜索字段（可选，带参数完成）
- `categories` - 类别过滤（可选）
- `sortBy` - 排序字段（可选）
- `sortOrder` - 排序顺序（可选）
- `limit` - 结果数量（默认10）
- `offset` - 分页偏移（默认0）

**示例：**
```json
{
  "query": "transformer models",
  "field": "title",
  "limit": 20
}
```

### 2. fetch_paper - 获取论文详情
根据ID和平台获取论文完整元数据。

**参数：**
- `id` - 论文ID（必需）
- `source` - 平台源（必需）

**示例：**
```json
{
  "id": "2301.00001",
  "source": "arxiv"
}
```

### 3. fetch_latest - 获取最新论文
从特定类别获取最新发表的论文。

**参数：**
- `source` - 平台源（必需）
- `category` - 类别名称（必需，带上下文感知完成）
- `limit` - 结果数量（默认10）
- `useCache` - 使用缓存（默认true）
- `summaryOnly` - 仅摘要（大数据集自动启用）
- `enableEnhancement` - 启用增强（默认true）

**示例：**
```json
{
  "source": "arxiv",
  "category": "cs.AI",
  "limit": 20
}
```

### 4. list_categories - 列出平台类别
查看所有平台的可用类别。

**参数：**
- `source` - 平台源（可选，留空列出所有）

### 5. advanced_search - 高级搜索
支持布尔运算符的复杂查询。

**参数：**
- `query` - 搜索查询（支持AND/OR/NOT）
- `sources` - 平台列表（可选）
- `field` - 搜索字段（可选）
- `fuzzyMatch` - 模糊匹配（默认false）
- `exactMatch` - 精确匹配（默认false）
- `limit` - 结果数量（默认10）

**示例：**
```json
{
  "query": "(deep learning OR neural networks) AND NOT reinforcement",
  "fuzzyMatch": true
}
```

### 6. trend_analysis - 研究趋势分析
分析主题的时间趋势和发展。

**参数：**
- `topic` - 研究主题（必需）
- `sources` - 平台列表（可选）
- `period` - 时间段（week/month/year/all）
- `granularity` - 时间粒度（day/week/month）
- `limit` - 每期论文数（默认100）

## 📦 资源使用

访问学术资源：

```
# 获取论文
paper://arxiv/2301.00001

# 浏览类别
category://arxiv/cs.AI

# 搜索结果
search://machine+learning
```

## 💡 提示模板

### 文献综述
```typescript
literature_review({
  topic: "deep learning",
  timeframe: "past_year"
})
```

### 研究差距分析
```typescript
research_gap_analysis({
  domain: "computer science",
  subtopic: "transformer models"
})
```

### 论文比较
```typescript
paper_comparison({
  paperIds: "arxiv:2301.00001,arxiv:2302.00002",
  aspect: "methodology"
})
```

## 🔧 配置

### MCP客户端配置

**Claude Desktop、RooCode、通义灵码:**
```json
{
  "mcpServers": {
    "aigroup-paper": {
      "command": "npx",
      "args": ["aigroup-paper-mcp"]
    }
  }
}
```

**环境变量：**
创建 `.env` 文件：
```env
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=3600
MAX_SEARCH_LIMIT=100
```



## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)


