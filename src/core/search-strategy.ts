import { PlatformSource } from '../types/paper.js';
import { SearchQuery } from '../types/search.js';
import { SearchStrategyConfig } from '../types/config.js';
import { Logger } from './logger.js';
import { 
  PLATFORM_METADATA, 
  PlatformCategory, 
  TOPIC_KEYWORDS,
  PLATFORM_RECOMMENDATION_WEIGHTS 
} from '../config/platform-recommendations.js';

const logger = new Logger('SearchStrategy');

/**
 * 平台选择策略结果
 */
export interface PlatformSelectionResult {
  platforms: PlatformSource[];
  reasons: string[];
  confidence: number;
  fallbackPlatforms?: PlatformSource[];
}

/**
 * 主题分类结果
 */
export interface TopicClassificationResult {
  categories: PlatformCategory[];
  confidence: number;
  keywords: string[];
}

/**
 * 平台推荐评分
 */
interface PlatformScore {
  source: PlatformSource;
  score: number;
  reasons: string[];
}

/**
 * 搜索策略管理器
 * 负责智能平台选择、主题分类和搜索优化
 */
export class SearchStrategyManager {
  private static instance: SearchStrategyManager;

  private constructor() {}

  static getInstance(): SearchStrategyManager {
    if (!SearchStrategyManager.instance) {
      SearchStrategyManager.instance = new SearchStrategyManager();
    }
    return SearchStrategyManager.instance;
  }

  /**
   * 智能选择最佳平台组合
   */
  selectPlatforms(
    query: SearchQuery,
    config?: SearchStrategyConfig
  ): PlatformSelectionResult {
    const topicResult = this.classifyTopic(query.query);
    const scores = this.calculatePlatformScores(topicResult, config);

    // 排序并选择得分最高的平台
    const sortedPlatforms = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 最多选择5个平台

    const platforms = sortedPlatforms.map(s => s.source);
    const reasons = sortedPlatforms.flatMap(s => s.reasons);

    // 计算整体置信度
    const confidence = this.calculateConfidence(sortedPlatforms, topicResult);

    // 准备降级平台（成功率较低但覆盖广的平台）
    const fallbackPlatforms = this.selectFallbackPlatforms(platforms);

    logger.info('选择平台策略', {
      platforms,
      confidence,
      topicCategories: topicResult.categories,
      fallbackPlatforms
    });

    return {
      platforms,
      reasons,
      confidence,
      fallbackPlatforms
    };
  }

  /**
   * 主题分类
   */
  classifyTopic(query: string): TopicClassificationResult {
    const queryLower = query.toLowerCase();
    const matchedCategories = new Map<PlatformCategory, number>();
    const matchedKeywords: string[] = [];

    // 匹配关键词
    for (const [keyword, categories] of Object.entries(TOPIC_KEYWORDS)) {
      if (queryLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        categories.forEach(cat => {
          matchedCategories.set(cat, (matchedCategories.get(cat) || 0) + 1);
        });
      }
    }

    // 按匹配次数排序类别
    const sortedCategories = Array.from(matchedCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    // 如果没有匹配，使用通用类别
    const categories = sortedCategories.length > 0 
      ? sortedCategories 
      : [PlatformCategory.MULTIDISCIPLINARY];

    // 计算置信度
    const confidence = matchedKeywords.length > 0 
      ? Math.min(matchedKeywords.length / 3, 1.0) 
      : 0.3;

    logger.debug('主题分类结果', {
      categories,
      confidence,
      matchedKeywords
    });

    return {
      categories,
      confidence,
      keywords: matchedKeywords
    };
  }

  /**
   * 计算平台评分
   */
  private calculatePlatformScores(
    topicResult: TopicClassificationResult,
    config?: SearchStrategyConfig
  ): PlatformScore[] {
    const scores: PlatformScore[] = [];
    const minSuccessRate = config?.minSuccessRate || 0.7;

    for (const [source, metadata] of Object.entries(PLATFORM_METADATA)) {
      // 跳过成功率过低的平台
      if (metadata.successRate < minSuccessRate) {
        continue;
      }

      const reasons: string[] = [];
      let score = 0;

      // 1. 类别匹配度评分
      const categoryScore = this.calculateCategoryScore(
        metadata.categories,
        topicResult.categories
      );
      score += categoryScore * PLATFORM_RECOMMENDATION_WEIGHTS.categoryMatch;
      if (categoryScore > 0.5) {
        reasons.push(`主题匹配度高 (${(categoryScore * 100).toFixed(0)}%)`);
      }

      // 2. 成功率评分
      const successScore = metadata.successRate;
      score += successScore * PLATFORM_RECOMMENDATION_WEIGHTS.successRate;
      if (successScore > 0.9) {
        reasons.push(`高成功率 (${(successScore * 100).toFixed(0)}%)`);
      }

      // 3. 响应时间评分
      const responseScore = this.calculateResponseScore(
        metadata.responseTime,
        config?.preferredResponseTime
      );
      score += responseScore * PLATFORM_RECOMMENDATION_WEIGHTS.responseTime;
      if (responseScore > 0.8) {
        reasons.push('响应速度快');
      }

      // 4. 覆盖度评分
      const coverageScore = this.calculateCoverageScore(
        metadata.coverage,
        topicResult.keywords
      );
      score += coverageScore * PLATFORM_RECOMMENDATION_WEIGHTS.coverage;
      if (coverageScore > 0.5) {
        reasons.push('领域覆盖广');
      }

      // 5. 开放获取优先
      if (config?.prioritizeOpenAccess && this.isOpenAccessPlatform(source as PlatformSource)) {
        score += 0.1;
        reasons.push('支持开放获取');
      }

      scores.push({
        source: source as PlatformSource,
        score,
        reasons
      });
    }

    return scores;
  }

  /**
   * 计算类别匹配得分
   */
  private calculateCategoryScore(
    platformCategories: PlatformCategory[],
    topicCategories: PlatformCategory[]
  ): number {
    if (topicCategories.length === 0) return 0.5;

    const matches = platformCategories.filter(cat => 
      topicCategories.includes(cat)
    ).length;

    return matches / topicCategories.length;
  }

  /**
   * 计算响应时间得分
   */
  private calculateResponseScore(
    platformResponseTime: number,
    preferredTime?: number
  ): number {
    const targetTime = preferredTime || 2000;
    if (platformResponseTime <= targetTime) return 1.0;
    if (platformResponseTime >= targetTime * 3) return 0.2;
    
    // 线性衰减
    return 1.0 - (platformResponseTime - targetTime) / (targetTime * 2);
  }

  /**
   * 计算覆盖度得分
   */
  private calculateCoverageScore(
    platformCoverage: string[],
    keywords: string[]
  ): number {
    if (keywords.length === 0) return 0.5;

    const matches = keywords.filter(keyword => 
      platformCoverage.some(coverage => 
        coverage.toLowerCase().includes(keyword.toLowerCase())
      )
    ).length;

    return matches / keywords.length;
  }

  /**
   * 判断是否为开放获取平台
   */
  private isOpenAccessPlatform(source: PlatformSource): boolean {
    const openAccessPlatforms = [
      PlatformSource.ARXIV,
      PlatformSource.PMC,
      PlatformSource.BIORXIV,
      PlatformSource.MEDRXIV,
      PlatformSource.CORE
    ];
    return openAccessPlatforms.includes(source);
  }

  /**
   * 计算整体置信度
   */
  private calculateConfidence(
    platforms: PlatformScore[],
    topicResult: TopicClassificationResult
  ): number {
    if (platforms.length === 0) return 0;

    const avgScore = platforms.reduce((sum, p) => sum + p.score, 0) / platforms.length;
    const topicConfidence = topicResult.confidence;

    return (avgScore + topicConfidence) / 2;
  }

  /**
   * 选择降级平台
   */
  private selectFallbackPlatforms(
    primaryPlatforms: PlatformSource[]
  ): PlatformSource[] {
    const fallbacks = [
      PlatformSource.OPENALEX,
      PlatformSource.CROSSREF,
      PlatformSource.CORE
    ];

    return fallbacks.filter(fb => !primaryPlatforms.includes(fb));
  }

  /**
   * 优化并行搜索策略
   */
  optimizeParallelStrategy(
    platforms: PlatformSource[],
    config?: SearchStrategyConfig
  ): {
    batches: PlatformSource[][];
    strategy: 'parallel' | 'sequential' | 'hybrid';
  } {
    const maxParallel = config?.maxParallelRequests || 3;

    // 按响应时间分组
    const fastPlatforms: PlatformSource[] = [];
    const slowPlatforms: PlatformSource[] = [];

    platforms.forEach(source => {
      const metadata = PLATFORM_METADATA[source];
      if (metadata.responseTime < 2000) {
        fastPlatforms.push(source);
      } else {
        slowPlatforms.push(source);
      }
    });

    // 混合策略：快速平台并行，慢速平台顺序
    if (fastPlatforms.length <= maxParallel && slowPlatforms.length > 0) {
      return {
        batches: [fastPlatforms, ...slowPlatforms.map(p => [p])],
        strategy: 'hybrid'
      };
    }

    // 并行策略：所有平台分批并行
    if (platforms.length <= maxParallel) {
      return {
        batches: [platforms],
        strategy: 'parallel'
      };
    }

    // 分批并行
    const batches: PlatformSource[][] = [];
    for (let i = 0; i < platforms.length; i += maxParallel) {
      batches.push(platforms.slice(i, i + maxParallel));
    }

    return {
      batches,
      strategy: 'parallel'
    };
  }

  /**
   * 获取平台元数据
   */
  getPlatformMetadata(source: PlatformSource) {
    return PLATFORM_METADATA[source];
  }
}

// 导出单例
export const searchStrategyManager = SearchStrategyManager.getInstance();