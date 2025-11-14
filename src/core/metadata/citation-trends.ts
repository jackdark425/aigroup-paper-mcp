/**
 * 引用趋势分析模块
 */

import { Paper, CitationTrends, CitationPerYear } from '../../types/paper.js';

export class CitationTrendsAnalyzer {
  /**
   * 分析引用趋势
   */
  static analyzeCitationTrends(paper: Paper): CitationTrends | undefined {
    if (!paper.citationCount || paper.citationCount === 0) {
      return undefined;
    }
    
    const currentYear = new Date().getFullYear();
    const publicationYear = paper.publishedDate.getFullYear();
    const yearsSincePublication = currentYear - publicationYear;
    
    if (yearsSincePublication <= 0) {
      return {
        totalCitations: paper.citationCount,
        citationsPerYear: [{
          year: publicationYear,
          count: paper.citationCount,
          cumulative: paper.citationCount
        }],
        averageCitationsPerYear: paper.citationCount,
        peakYear: publicationYear,
        peakCitations: paper.citationCount,
        growthRate: 0,
        recentCitationRate: paper.citationCount
      };
    }
    
    // 估算年度引用分布（简化版）
    const citationsPerYear: CitationPerYear[] = [];
    const avgCitationsPerYear = paper.citationCount / yearsSincePublication;
    
    let cumulative = 0;
    for (let i = 0; i <= yearsSincePublication; i++) {
      const year = publicationYear + i;
      // 使用简单的指数增长模型估算
      const estimatedCount = Math.round(avgCitationsPerYear * (1 + i * 0.1));
      cumulative += estimatedCount;
      
      citationsPerYear.push({
        year,
        count: estimatedCount,
        cumulative
      });
    }
    
    // 找出峰值年份
    const peakData = citationsPerYear.reduce((max, curr) => 
      curr.count > max.count ? curr : max
    );
    
    // 计算近期引用率（最近2年）
    const recentYears = citationsPerYear.slice(-2);
    const recentCitationRate = recentYears.reduce((sum, y) => sum + y.count, 0) / recentYears.length;
    
    // 计算增长率
    const firstYearCitations = citationsPerYear[0].count || 1;
    const lastYearCitations = citationsPerYear[citationsPerYear.length - 1].count || 0;
    const growthRate = ((lastYearCitations - firstYearCitations) / firstYearCitations) * 100;
    
    return {
      totalCitations: paper.citationCount,
      citationsPerYear,
      averageCitationsPerYear: avgCitationsPerYear,
      peakYear: peakData.year,
      peakCitations: peakData.count,
      growthRate,
      recentCitationRate
    };
  }
}