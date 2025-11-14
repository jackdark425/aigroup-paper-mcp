/**
 * 论文摘要生成模块
 */

import { Paper, PaperSummaryInfo } from '../../types/paper.js';

export class SummaryGenerator {
  /**
   * 生成论文摘要
   */
  static async generatePaperSummary(paper: Paper): Promise<PaperSummaryInfo> {
    const summary: PaperSummaryInfo = {
      keyPoints: [],
      contributions: [],
      mainResults: [],
      confidence: 0.7
    };
    
    if (paper.title) {
      const titleKeyPoint = this.extractKeyPointsFromTitle(paper.title);
      if (summary.keyPoints) {
        summary.keyPoints.push(titleKeyPoint);
      }
    }
    
    if (paper.abstract) {
      const abstractKeyPoints = this.extractKeyPointsFromAbstract(paper.abstract);
      if (summary.keyPoints) {
        summary.keyPoints.push(...abstractKeyPoints);
      }
      
      summary.contributions = this.extractContributions(paper.abstract);
      summary.methodology = this.extractMethodology(paper.abstract);
      summary.mainResults = this.extractMainResults(paper.abstract);
    }
    
    if (paper.abstract) {
      summary.generated = this.generateAutoSummary(paper.abstract);
    }
    
    summary.language = this.detectLanguage(paper);
    
    return summary;
  }
  
  /**
   * 从标题提取关键点
   */
  private static extractKeyPointsFromTitle(title: string): string {
    const keywords = title.split(/[:\-()]/)[0];
    return keywords.trim();
  }
  
  /**
   * 从摘要提取关键点
   */
  private static extractKeyPointsFromAbstract(abstract: string): string[] {
    const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).map(s => s.trim());
  }
  
  /**
   * 提取贡献
   */
  private static extractContributions(abstract: string): string[] {
    const contributions: string[] = [];
    const contributionPatterns = [
      /we (propose|introduce|develop|present) ([^.!?]+)/gi,
      /our (contribution|method|approach) ([^.!?]+)/gi,
      /this (paper|work) (presents|proposes|introduces) ([^.!?]+)/gi
    ];
    
    for (const pattern of contributionPatterns) {
      const matches = abstract.match(pattern);
      if (matches) {
        contributions.push(...matches.map(m => m.replace(/^we\s+/i, '').trim()));
      }
    }
    
    return contributions.slice(0, 3);
  }
  
  /**
   * 提取方法论
   */
  private static extractMethodology(abstract: string): string {
    const methodologyPatterns = [
      /using ([^.!?]+(method|approach|technique|framework))/gi,
      /based on ([^.!?]+)/gi,
      /we (employ|use|apply) ([^.!?]+)/gi
    ];
    
    for (const pattern of methodologyPatterns) {
      const match = abstract.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  }
  
  /**
   * 提取主要结果
   */
  private static extractMainResults(abstract: string): string[] {
    const results: string[] = [];
    const resultPatterns = [
      /(results? show|find that|demonstrate that) ([^.!?]+)/gi,
      /we (find|show|demonstrate) ([^.!?]+)/gi,
      /(significantly|substantially) ([^.!?]+)/gi
    ];
    
    for (const pattern of resultPatterns) {
      const matches = abstract.match(pattern);
      if (matches) {
        results.push(...matches.map(m => m.trim()));
      }
    }
    
    return results.slice(0, 3);
  }
  
  /**
   * 生成自动摘要
   */
  private static generateAutoSummary(abstract: string): string {
    const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length <= 3) {
      return abstract;
    }
    
    return [sentences[0], ...sentences.slice(-2)].join('. ') + '.';
  }
  
  /**
   * 检测语言
   */
  private static detectLanguage(paper: Paper): string {
    if (paper.language) {
      return paper.language;
    }
    
    const text = (paper.title + ' ' + (paper.abstract || '')).toLowerCase();
    
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return 'zh';
    }
    
    return 'en';
  }
  
  /**
   * 判断是否有通讯作者
   */
  static hasCorrespondingAuthor(paper: Paper): boolean {
    return paper.authors.some(author => author.email || author.orcid);
  }
}