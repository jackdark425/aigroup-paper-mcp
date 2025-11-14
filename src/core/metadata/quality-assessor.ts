/**
 * 数据质量评估模块
 */

import { Paper, DataQualityMetrics } from '../../types/paper.js';

export class QualityAssessor {
  /**
   * 评估数据质量
   */
  static assessDataQuality(paper: Paper): DataQualityMetrics {
    const requiredFields = ['id', 'title', 'authors', 'publishedDate', 'source'];
    const recommendedFields = ['abstract', 'doi', 'journal', 'citationCount', 'keywords'];
    const optionalFields = ['conference', 'volume', 'issue', 'pages', 'license'];
    
    const missingFields: string[] = [];
    const verifiedFields: string[] = [];
    
    // 检查必需字段
    let requiredScore = 0;
    for (const field of requiredFields) {
      if (this.hasValidField(paper, field)) {
        requiredScore += 20;
        verifiedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }
    
    // 检查推荐字段
    let recommendedScore = 0;
    for (const field of recommendedFields) {
      if (this.hasValidField(paper, field)) {
        recommendedScore += 10;
        verifiedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }
    
    // 检查可选字段
    let optionalScore = 0;
    for (const field of optionalFields) {
      if (this.hasValidField(paper, field)) {
        optionalScore += 5;
        verifiedFields.push(field);
      }
    }
    
    // 计算完整性分数
    const completeness = Math.min(requiredScore + recommendedScore + optionalScore, 100);
    
    // 计算准确性分数（基于数据一致性）
    const accuracy = this.assessAccuracy(paper);
    
    // 计算一致性分数
    const consistency = this.assessConsistency(paper);
    
    // 计算时效性分数
    const timeliness = this.assessTimeliness(paper);
    
    // 总体质量分数
    const overall = (completeness * 0.4 + accuracy * 0.3 + consistency * 0.2 + timeliness * 0.1);
    
    return {
      completeness,
      accuracy,
      consistency,
      timeliness,
      overall,
      missingFields,
      verifiedFields,
      dataSource: paper.source,
      lastValidated: new Date()
    };
  }
  
  /**
   * 检查字段是否有效
   */
  private static hasValidField(paper: any, field: string): boolean {
    const value = paper[field];
    
    if (value === undefined || value === null) {
      return false;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 评估准确性
   */
  private static assessAccuracy(paper: Paper): number {
    let score = 100;
    
    // 检查作者格式
    if (paper.authors.some(a => !a.name || a.name.length < 2)) {
      score -= 10;
    }
    
    // 检查日期有效性
    if (paper.publishedDate && paper.publishedDate > new Date()) {
      score -= 20;
    }
    
    // 检查DOI格式
    if (paper.doi && !this.isValidDOI(paper.doi)) {
      score -= 15;
    }
    
    // 检查URL有效性
    if (paper.urls.pdf && !this.isValidURL(paper.urls.pdf)) {
      score -= 10;
    }
    
    return Math.max(score, 0);
  }
  
  /**
   * 评估一致性
   */
  private static assessConsistency(paper: Paper): number {
    let score = 100;
    
    // 检查年份一致性
    const year = paper.publishedDate.getFullYear();
    if (paper.metadata.year && paper.metadata.year !== year) {
      score -= 20;
    }
    
    // 检查作者数量一致性
    if (paper.metadata.authorCount && paper.metadata.authorCount !== paper.authors.length) {
      score -= 15;
    }
    
    return Math.max(score, 0);
  }
  
  /**
   * 评估时效性
   */
  private static assessTimeliness(paper: Paper): number {
    const now = new Date();
    const monthsSincePublication = (now.getTime() - paper.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // 最近6个月: 100分
    if (monthsSincePublication <= 6) return 100;
    
    // 最近1年: 90分
    if (monthsSincePublication <= 12) return 90;
    
    // 最近2年: 80分
    if (monthsSincePublication <= 24) return 80;
    
    // 最近5年: 60分
    if (monthsSincePublication <= 60) return 60;
    
    // 最近10年: 40分
    if (monthsSincePublication <= 120) return 40;
    
    // 超过10年: 20分
    return 20;
  }
  
  /**
   * 验证DOI格式
   */
  private static isValidDOI(doi: string): boolean {
    const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
    return doiPattern.test(doi);
  }
  
  /**
   * 验证URL格式
   */
  private static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}