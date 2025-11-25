import { z } from 'zod';

/**
 * 通用的论文schema定义
 */
export const paperSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string().optional(),
  published: z.string().optional(),
  source: z.string(),
  citations: z.number().optional(),
  url: z.string().optional()
});

/**
 * 搜索结果schema
 */
export const searchResultSchema = z.object({
  results: z.array(paperSchema),
  total: z.number(),
  sources: z.array(z.string())
});

/**
 * 论文列表schema
 */
export const paperListSchema = z.object({
  papers: z.array(paperSchema),
  total: z.number(),
  category: z.string()
});

/**
 * 类别schema
 */
export const categorySchema = z.object({
  source: z.string(),
  category: z.string(),
  description: z.string().optional(),
  paperCount: z.number().optional()
});

/**
 * 趋势数据点schema
 */
export const trendDataPointSchema = z.object({
  period: z.string(),
  paperCount: z.number(),
  growthRate: z.number().optional(),
  topKeywords: z.array(z.string())
});