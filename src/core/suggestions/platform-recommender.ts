/**
 * 平台推荐器模块
 */

import { PlatformSource } from '../../types/paper.js';
import { 
  PLATFORM_METADATA, 
  PlatformCategory, 
  TOPIC_KEYWORDS, 
  PLATFORM_RECOMMENDATION_WEIGHTS
} from '../../config/platform-recommendations.js';

/**
 * 平台推荐结果
 */
export interface PlatformRecommendation {
  source: PlatformSource;
  name: string;
  score: number;
  reasons: string[];
  confidence: number;
}

/**
 * 平台推荐器
 */
export class PlatformRecommender {
  /**
   * 推荐平台
   */
  static recommendPlatforms(query: string, currentSources?: PlatformSource[]): PlatformSource[] {
    const queryCategories = this.detectQueryCategories(query);
    const allPlatforms = Object.values(PlatformSource);
    
    // 计算每个平台的推荐分数
    const platformScores = allPlatforms.map(source => {
      const metadata = PLATFORM_METADATA[source];
      const score = this.calculatePlatformScore(metadata, queryCategories);
      return { source, score, metadata };
    });

    // 按分数排序并过滤
    const recommendedPlatforms = platformScores
      .filter(p => p.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => p.source);

    // 如果用户已经指定了平台，确保包含它们
    if (currentSources && currentSources.length > 0) {
      const combined = [...new Set([...currentSources, ...recommendedPlatforms])];
      return combined.slice(0, 5);
    }

    return recommendedPlatforms.length > 0 ? recommendedPlatforms : allPlatforms.slice(0, 3);
  }

  /**
   * 检测查询主题分类
   */
  static detectQueryCategories(query: string): PlatformCategory[] {
    const categories = new Set<PlatformCategory>();
    const queryLower = query.toLowerCase();

    // 检查关键词匹配
    for (const [keyword, keywordCategories] of Object.entries(TOPIC_KEYWORDS)) {
      if (queryLower.includes(keyword.toLowerCase())) {
        keywordCategories.forEach(cat => categories.add(cat));
      }
    }

    // 如果没有匹配到特定分类，使用通用分类
    if (categories.size === 0) {
      categories.add(PlatformCategory.GENERAL_ACADEMIC);
    }

    return Array.from(categories);
  }

  /**
   * 计算平台推荐分数
   */
  static calculatePlatformScore(metadata: any, queryCategories: PlatformCategory[]): number {
    let score = 0;

    // 分类匹配分数
    const categoryMatch = queryCategories.some(cat => metadata.categories.includes(cat));
    if (categoryMatch) {
      score += PLATFORM_RECOMMENDATION_WEIGHTS.categoryMatch;
    }

    // 成功率分数
    score += metadata.successRate * PLATFORM_RECOMMENDATION_WEIGHTS.successRate;

    // 响应时间分数（响应时间越短分数越高）
    const responseTimeScore = Math.max(0, 1 - (metadata.responseTime / 10000));
    score += responseTimeScore * PLATFORM_RECOMMENDATION_WEIGHTS.responseTime;

    // 覆盖范围分数
    const coverageScore = metadata.coverage.length > 5 ? 1 : metadata.coverage.length / 5;
    score += coverageScore * PLATFORM_RECOMMENDATION_WEIGHTS.coverage;

    return Math.min(1, score);
  }

  /**
   * 验证平台列表
   */
  static validatePlatforms(sources: PlatformSource[]): { valid: PlatformSource[]; invalid: string[] } {
    const valid: PlatformSource[] = [];
    const invalid: string[] = [];

    sources.forEach(source => {
      if (Object.values(PlatformSource).includes(source)) {
        valid.push(source);
      } else {
        invalid.push(source);
      }
    });

    return { valid, invalid };
  }

  /**
   * 获取所有可用平台
   */
  static getAllAvailablePlatforms(): PlatformSource[] {
    return Object.values(PlatformSource);
  }

  /**
   * 获取平台详细信息
   */
  static getPlatformDetails(source: PlatformSource) {
    return PLATFORM_METADATA[source];
  }
}