/**
 * 统计分析模块
 */

import { Paper, EnhancedStats, InfluenceLevel, CitationDistribution } from '../../types/paper.js';
import { PlatformSource } from '../../types/paper.js';

export class StatsAnalyzer {
  /**
   * 计算增强统计信息
   */
  static calculateEnhancedStats(papers: Paper[]): EnhancedStats {
    const citations = papers.map(p => p.citationCount || 0);
    const totalCitations = citations.reduce((sum, c) => sum + c, 0);
    const averageCitations = papers.length > 0 ? totalCitations / papers.length : 0;
    const maxCitations = Math.max(...citations, 0);
    
    const citationDistribution = this.calculateCitationDistribution(citations);
    
    const dates = papers.map(p => p.publishedDate);
    const oldestPaper = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestPaper = new Date(Math.max(...dates.map(d => d.getTime())));
    const publicationYears = [...new Set(papers.map(p => p.publishedDate.getFullYear()))].sort();
    
    const platformStats: EnhancedStats['platformStats'] = {};
    for (const source of Object.values(PlatformSource)) {
      const sourcePapers = papers.filter(p => p.source === source);
      if (sourcePapers.length > 0) {
        const sourceCitations = sourcePapers.map(p => p.citationCount || 0);
        const avgCitations = sourceCitations.reduce((sum, c) => sum + c, 0) / sourcePapers.length;
        const fullTextAvailable = sourcePapers.filter(p => p.fullTextAvailable).length;
        
        platformStats[source] = {
          count: sourcePapers.length,
          averageCitations: avgCitations,
          fullTextAvailable
        };
      }
    }
    
    const impactLevels = papers.map(p => p.enhancedMetadata?.influenceLevel);
    const highImpactCount = impactLevels.filter(l => l === InfluenceLevel.HIGH || l === InfluenceLevel.VERY_HIGH).length;
    const mediumImpactCount = impactLevels.filter(l => l === InfluenceLevel.MEDIUM).length;
    const lowImpactCount = impactLevels.filter(l => l === InfluenceLevel.LOW).length;
    const impactScores = papers.map(p => p.enhancedMetadata?.impactScore || 0);
    const averageImpactScore = impactScores.reduce((sum, s) => sum + s, 0) / papers.length;
    
    return {
      citationStats: {
        totalCitations,
        averageCitations,
        maxCitations,
        citationDistribution
      },
      timeStats: {
        oldestPaper,
        newestPaper,
        publicationYears
      },
      platformStats,
      impactStats: {
        highImpactCount,
        mediumImpactCount,
        lowImpactCount,
        averageImpactScore
      }
    };
  }
  
  /**
   * 计算引用分布
   */
  static calculateCitationDistribution(citations: number[]): CitationDistribution[] {
    const ranges = [
      { label: '0-10', min: 0, max: 10 },
      { label: '11-50', min: 11, max: 50 },
      { label: '51-100', min: 51, max: 100 },
      { label: '101-500', min: 101, max: 500 },
      { label: '500+', min: 501, max: Infinity }
    ];
    
    const total = citations.length;
    
    return ranges.map(range => {
      const count = citations.filter(c => c >= range.min && c <= range.max).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      
      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 100) / 100
      };
    });
  }
  
  /**
   * 识别高影响力论文
   */
  static identifyHighImpactPapers(papers: Paper[]): Paper[] {
    return papers
      .filter(p => {
        const influenceLevel = p.enhancedMetadata?.influenceLevel;
        return influenceLevel === InfluenceLevel.HIGH || influenceLevel === InfluenceLevel.VERY_HIGH;
      })
      .sort((a, b) => {
        const scoreA = a.enhancedMetadata?.impactScore || 0;
        const scoreB = b.enhancedMetadata?.impactScore || 0;
        return scoreB - scoreA;
      });
  }
  
  /**
   * 按影响力排序论文
   */
  static sortPapersByImpact(papers: Paper[]): Paper[] {
    return [...papers].sort((a, b) => {
      const scoreA = a.enhancedMetadata?.impactScore || 0;
      const scoreB = b.enhancedMetadata?.impactScore || 0;
      return scoreB - scoreA;
    });
  }
  
  /**
   * 按来源统计论文数量
   */
  static calculateTotalBySource(papers: Paper[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const paper of papers) {
      const source = paper.source;
      result[source] = (result[source] || 0) + 1;
    }
    
    return result;
  }
}