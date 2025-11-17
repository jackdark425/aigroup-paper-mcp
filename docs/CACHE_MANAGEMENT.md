# 缓存管理功能文档

## 问题背景

在之前的版本中，大模型无法访问缓存或JSON后的路径，导致以下问题：
- 无法查看已缓存的文献数据
- 无法管理缓存内容
- 无法获取缓存统计信息
- 无法清理过期或不需要的缓存

## 解决方案

我们新增了 `manage_cache` MCP工具，让大模型能够直接管理缓存系统。

## 可用操作

### 1. 获取缓存统计信息

**用途**: 查看缓存系统的整体状态

**参数**:
- `action`: `"stats"`

**示例**:
```json
{
  "action": "stats"
}
```

**返回**:
```json
{
  "action": "stats",
  "totalKeys": 15,
  "activeKeys": 12,
  "expiredKeys": 3,
  "totalSizeBytes": 24567,
  "totalSizeMB": "0.02",
  "averageItemSize": 1637,
  "sourceDistribution": {
    "arxiv": 8,
    "openalex": 4
  },
  "message": "Cache statistics: 15 total keys, 12 active, 3 expired"
}
```

### 2. 列出缓存键

**用途**: 查看所有缓存键及其详细信息

**参数**:
- `action`: `"list"`
- `pattern`: (可选) 过滤模式，支持通配符 `*`

**示例**:
```json
{
  "action": "list",
  "pattern": "fetch_latest:arxiv:*"
}
```

**返回**:
```json
{
  "action": "list",
  "totalKeys": 15,
  "filteredKeys": 8,
  "keys": [
    {
      "key": "fetch_latest:arxiv:cs:10:false:true",
      "size": 2456,
      "expiresAt": "2025-11-14T13:00:00.000Z",
      "createdAt": "2025-11-14T12:30:00.000Z",
      "isExpired": false
    }
  ],
  "pattern": "fetch_latest:arxiv:*",
  "message": "Found 8 cache keys matching pattern \"fetch_latest:arxiv:*\""
}
```

### 3. 获取缓存项

**用途**: 获取特定缓存键的详细内容

**参数**:
- `action`: `"get"`
- `key`: 缓存键（必需）

**示例**:
```json
{
  "action": "get",
  "key": "fetch_latest:arxiv:cs:10:false:true"
}
```

**返回**:
```json
{
  "action": "get",
  "key": "fetch_latest:arxiv:cs:10:false:true",
  "found": true,
  "data": {
    "papers": [...],
    "source": "arxiv",
    "category": "cs",
    "count": 10
  },
  "metadata": {
    "size": 2456,
    "expiresAt": "2025-11-14T13:00:00.000Z",
    "createdAt": "2025-11-14T12:30:00.000Z",
    "ttlSeconds": 1800
  },
  "message": "Retrieved cache item \"fetch_latest:arxiv:cs:10:false:true\""
}
```

### 4. 清理缓存

**用途**: 删除缓存项

**参数**:
- `action`: `"clear"`
- `pattern`: (可选) 删除匹配模式的缓存键

**示例**:
```json
{
  "action": "clear",
  "pattern": "fetch_latest:arxiv:*"
}
```

**返回**:
```json
{
  "action": "clear",
  "totalDeleted": 8,
  "remainingKeys": 7,
  "pattern": "fetch_latest:arxiv:*",
  "message": "Cleared 8 cache keys matching pattern \"fetch_latest:arxiv:*\""
}
```

## 缓存键格式说明

缓存键采用以下格式，便于识别和管理：

- `fetch_latest:{source}:{category}:{limit}:{summaryMode}:{enhancement}`
- `search_papers:{query}:{sources}:{limit}`
- `fetch_paper:{source}:{id}`

**字段说明**:
- `source`: 平台来源 (arxiv, openalex, etc.)
- `category`: 类别/主题
- `limit`: 请求数量
- `summaryMode`: 是否摘要模式
- `enhancement`: 是否启用增强
- `query`: 搜索查询
- `id`: 论文ID

## 使用场景

### 场景1: 查看缓存内容
```json
{
  "action": "list",
  "pattern": "*arxiv*"
}
```

### 场景2: 获取特定搜索结果的缓存
```json
{
  "action": "get", 
  "key": "search_papers:machine learning:arxiv,openalex:20"
}
```

### 场景3: 清理过期缓存
```json
{
  "action": "clear"
}
```

### 场景4: 监控缓存使用情况
```json
{
  "action": "stats"
}
```

## 注意事项

1. **缓存过期**: 缓存项有TTL设置，过期后会自动清理
2. **大小限制**: 缓存有最大大小限制，超出时会自动清理最旧的项目
3. **性能影响**: 频繁的缓存操作可能影响性能，建议合理使用
4. **数据一致性**: 缓存数据可能与源平台不同步，重要数据建议重新获取

## 智能缓存搜索

为了解决"每次查询内容都不一样"的问题，我们新增了智能缓存搜索功能。

### 智能缓存搜索工具

**用途**: 基于语义相似度在缓存中查找相关文献数据，即使查询内容不完全相同也能找到相关结果。

**参数**:
- `query`: 搜索查询
- `similarityThreshold`: 语义相似度阈值（0-1，默认0.7）
- `maxResults`: 最大返回结果数（默认10）
- `includeExpired`: 是否包含过期缓存（默认false）

**示例**:
```json
{
  "query": "机器学习在医疗诊断中的应用",
  "similarityThreshold": 0.6,
  "maxResults": 5
}
```

**返回**:
```json
{
  "action": "smart_search",
  "query": "机器学习在医疗诊断中的应用",
  "totalKeys": 15,
  "validKeys": 12,
  "matchedResults": 3,
  "similarityThreshold": 0.6,
  "results": [
    {
      "key": "search_papers:medical diagnosis machine learning:arxiv:20",
      "similarityScore": 0.85,
      "data": {...},
      "metadata": {...}
    }
  ],
  "suggestions": [
    "找到高度相关的缓存，可以直接使用",
    "相关数据来自: arxiv",
    "3 个缓存项数据较新"
  ],
  "message": "找到 3 个相关缓存项（相似度 ≥ 0.6）"
}
```

### 工作原理

智能缓存搜索基于以下技术：

1. **文本预处理**: 移除标点、转换为小写、分词、去重
2. **特征提取**: 从缓存键和内容中提取关键词
3. **相似度计算**: 使用Jaccard相似度算法
4. **智能建议**: 基于相似度和数据时效性提供建议

### 使用场景

#### 场景1: 查找相关研究
```json
{
  "query": "深度学习在图像识别中的应用",
  "similarityThreshold": 0.7
}
```

#### 场景2: 探索相关领域
```json
{
  "query": "自然语言处理",
  "similarityThreshold": 0.5,
  "maxResults": 15
}
```

#### 场景3: 查找特定技术
```json
{
  "query": "transformer模型",
  "similarityThreshold": 0.8
}
```

## 集成到工作流

大模型现在可以：
- 在搜索前检查是否有相关缓存
- 在获取数据后验证缓存状态
- 定期清理不需要的缓存
- 监控缓存使用效率
- 重用已缓存的文献数据
- **基于语义相似度查找相关缓存**
- **智能推荐相关研究领域**
- **跨查询重用缓存数据**

这大大提高了数据访问效率和用户体验，特别是当查询内容不同但语义相关时。