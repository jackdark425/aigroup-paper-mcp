/**
 * 结果增强器 - 主入口
 * 负责增强搜索结果的关键信息提取和摘要生成
 */

import { Paper, EnhancedMetadata, EnhancedSearchResult } from '../types/paper.js';
import { Logger } from './logger.js';
import { MetadataEnhancer } from './metadata-enhancer.js';
import { ImpactCalculator } from './result/impact-calculator.js';
import { SummaryGenerator } from './result/summary-generator.js';
import { StatsAnalyzer } from './result/stats-analyzer.js';

const logger = new Logger('ResultEnhancer');

/**
 * 结果增强器 - 负责增强搜索结果的关键信息提取和摘要生成
 */
export class ResultEnhancer {
  /**
   * 增强搜索结果
   */
  static async enhanceSearchResult(papers: Paper[], query: string): Promise<EnhancedSearchResult> {
    logger.info(`开始增强搜索结果，共 ${papers.length} 篇论文`);
    
    const enhancedPapers = await Promise.all(
      papers.map(paper => this.enhancePaper(paper))
    );
    
    const enhancedStats = StatsAnalyzer.calculateEnhancedStats(enhancedPapers);
    const highImpactPapers = StatsAnalyzer.identifyHighImpactPapers(enhancedPapers);
    const sortedPapers = StatsAnalyzer.sortPapersByImpact(enhancedPapers);
    const totalBySource = StatsAnalyzer.calculateTotalBySource(enhancedPapers);
    
    return {
      papers: sortedPapers,
      total: enhancedPapers.length,
      totalBySource,
      query,
      enhancedStats,
      highImpactPapers
    };
  }
  
  /**
   * 增强单篇论文
   */
  static async enhancePaper(paper: Paper): Promise<Paper> {
    const enhancedMetadata: EnhancedMetadata = {
      ...paper.enhancedMetadata,
      // 计算影响力指标
      impactScore: ImpactCalculator.calculateImpactScore(paper),
      influenceLevel: ImpactCalculator.determineInfluenceLevel(paper),
      isHighlyCited: ImpactCalculator.isHighlyCited(paper),
      isHotPaper: ImpactCalculator.isHotPaper(paper),
      
      // 增强全文可用性信息
      fullTextDetails: MetadataEnhancer.enhanceFullTextAvailability(paper),
      
      // 增强发表信息
      publicationYear: paper.publishedDate.getFullYear(),
      publicationMonth: paper.publishedDate.getMonth() + 1,
      publicationQuarter: Math.ceil((paper.publishedDate.getMonth() + 1) / 3),
      
      // 增强作者信息
      authorCount: paper.authors.length,
      hasCorrespondingAuthor: SummaryGenerator.hasCorrespondingAuthor(paper),
      authorReputationScore: ImpactCalculator.calculateAuthorReputationScore(paper),
      
      // 平台权威性
      platformAuthority: ImpactCalculator.calculatePlatformAuthority(paper.source),
      
      // 生成摘要
      summary: await SummaryGenerator.generatePaperSummary(paper),
      
      // 时间相关指标
      recencyScore: ImpactCalculator.calculateRecencyScore(paper),
      citationVelocity: ImpactCalculator.calculateCitationVelocity(paper),
      
      // 引用趋势分析
      citationTrends: MetadataEnhancer.analyzeCitationTrends(paper),
      
      // 学术标识符
      identifiers: MetadataEnhancer.extractAcademicIdentifiers(paper),
      
      // 数据质量评估
      dataQuality: MetadataEnhancer.assessDataQuality(paper)
    };
    
    // 生成引用格式
    const citations = MetadataEnhancer.generateCitations(paper);
    
    return {
      ...paper,
      enhancedMetadata,
      citations
    };
  }
}