/**
 * 影响力计算模块
 */

import { Paper, InfluenceLevel, PlatformAuthority, AuthorityLevel, AuthorityFactor } from '../../types/paper.js';
import { PlatformSource } from '../../types/paper.js';

export class ImpactCalculator {
  /**
   * 计算影响力分数
   */
  static calculateImpactScore(paper: Paper): number {
    let score = 0;
    
    // 引用次数权重 (40%)
    if (paper.citationCount) {
      const citationScore = Math.min(paper.citationCount / 100, 1) * 40;
      score += citationScore;
    }
    
    // 平台权威性权重 (30%)
    const platformAuthority = this.calculatePlatformAuthority(paper.source);
    score += platformAuthority.score * 0.3;
    
    // 时间权重 (20%)
    const recencyScore = this.calculateRecencyScore(paper);
    score += recencyScore * 20;
    
    // 作者声誉权重 (10%)
    const authorScore = this.calculateAuthorReputationScore(paper);
    score += authorScore * 10;
    
    return Math.min(score, 100);
  }
  
  /**
   * 确定影响力级别
   */
  static determineInfluenceLevel(paper: Paper): InfluenceLevel {
    const impactScore = this.calculateImpactScore(paper);
    
    if (impactScore >= 80) return InfluenceLevel.VERY_HIGH;
    if (impactScore >= 60) return InfluenceLevel.HIGH;
    if (impactScore >= 40) return InfluenceLevel.MEDIUM;
    return InfluenceLevel.LOW;
  }
  
  /**
   * 判断是否高被引
   */
  static isHighlyCited(paper: Paper): boolean {
    if (!paper.citationCount) return false;
    
    const yearsSincePublication = new Date().getFullYear() - paper.publishedDate.getFullYear();
    const citationThreshold = yearsSincePublication * 10;
    
    return paper.citationCount >= citationThreshold;
  }
  
  /**
   * 判断是否热点论文
   */
  static isHotPaper(paper: Paper): boolean {
    if (!paper.citationCount) return false;
    
    const monthsSincePublication = (new Date().getTime() - paper.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSincePublication <= 6 && paper.citationCount >= 10) {
      return true;
    }
    
    if (monthsSincePublication <= 12 && paper.citationCount >= 50) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 计算作者声誉分数
   */
  static calculateAuthorReputationScore(paper: Paper): number {
    let score = 0;
    
    if (paper.authors.length >= 5) score += 20;
    else if (paper.authors.length >= 3) score += 10;
    
    const authorsWithOrcid = paper.authors.filter(a => a.orcid).length;
    if (authorsWithOrcid > 0) {
      score += (authorsWithOrcid / paper.authors.length) * 30;
    }
    
    const authorsWithAffiliation = paper.authors.filter(a => a.affiliations && a.affiliations.length > 0).length;
    if (authorsWithAffiliation > 0) {
      score += (authorsWithAffiliation / paper.authors.length) * 30;
    }
    
    const authorsWithEmail = paper.authors.filter(a => a.email).length;
    if (authorsWithEmail > 0) {
      score += (authorsWithEmail / paper.authors.length) * 20;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 计算平台权威性
   */
  static calculatePlatformAuthority(source: PlatformSource): PlatformAuthority {
    const authorityMap: Record<PlatformSource, { score: number; level: AuthorityLevel; factors: AuthorityFactor[] }> = {
      [PlatformSource.ARXIV]: {
        score: 85,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '预印本权威性', score: 80, description: '计算机科学和物理学领域权威预印本平台' },
          { name: '审核机制', score: 70, description: '基础审核但无同行评审' },
          { name: '更新频率', score: 95, description: '每日更新，时效性强' }
        ]
      },
      [PlatformSource.OPENALEX]: {
        score: 90,
        level: AuthorityLevel.VERY_HIGH,
        factors: [
          { name: '数据完整性', score: 95, description: '整合多个权威数据源' },
          { name: '引用网络', score: 90, description: '完整的引用关系网络' },
          { name: '元数据质量', score: 85, description: '丰富的结构化元数据' }
        ]
      },
      [PlatformSource.SEMANTIC_SCHOLAR]: {
        score: 88,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: 'AI增强', score: 90, description: 'AI驱动的论文理解' },
          { name: '引用分析', score: 85, description: '深入的引用分析' },
          { name: '全文提取', score: 80, description: '自动全文提取能力' }
        ]
      },
      [PlatformSource.CROSSREF]: {
        score: 92,
        level: AuthorityLevel.VERY_HIGH,
        factors: [
          { name: 'DOI权威', score: 95, description: '官方DOI注册机构' },
          { name: '期刊覆盖', score: 90, description: '覆盖绝大多数学术期刊' },
          { name: '元数据标准', score: 90, description: '遵循国际元数据标准' }
        ]
      },
      [PlatformSource.PUBMED]: {
        score: 95,
        level: AuthorityLevel.VERY_HIGH,
        factors: [
          { name: '医学权威', score: 98, description: '生物医学领域权威数据库' },
          { name: '同行评审', score: 95, description: '严格的同行评审机制' },
          { name: '质量控制', score: 92, description: '高质量的内容控制' }
        ]
      },
      [PlatformSource.PMC]: {
        score: 88,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '开放获取', score: 90, description: '开放获取全文数据库' },
          { name: '生物医学专注', score: 85, description: '专注生物医学领域' },
          { name: '全文可用性', score: 95, description: '高全文可用性' }
        ]
      },
      [PlatformSource.EUROPEPMC]: {
        score: 86,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '欧洲覆盖', score: 85, description: '欧洲生物医学研究覆盖' },
          { name: '多语言支持', score: 80, description: '多语言内容支持' },
          { name: '开放科学', score: 90, description: '开放科学倡导者' }
        ]
      },
      [PlatformSource.BIORXIV]: {
        score: 82,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '生物预印本', score: 85, description: '生物学领域权威预印本' },
          { name: '快速传播', score: 90, description: '研究成果快速传播' },
          { name: '社区认可', score: 70, description: '生物学社区高度认可' }
        ]
      },
      [PlatformSource.MEDRXIV]: {
        score: 82,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '医学预印本', score: 85, description: '医学领域权威预印本' },
          { name: '临床研究', score: 80, description: '临床研究快速分享' },
          { name: '公共卫生', score: 80, description: '公共卫生研究平台' }
        ]
      },
      [PlatformSource.CORE]: {
        score: 75,
        level: AuthorityLevel.MEDIUM,
        factors: [
          { name: '开放获取', score: 90, description: '大规模开放获取聚合' },
          { name: '覆盖广度', score: 85, description: '广泛的机构库覆盖' },
          { name: '质量差异', score: 50, description: '内容质量差异较大' }
        ]
      },
      [PlatformSource.GOOGLE_SCHOLAR]: {
        score: 78,
        level: AuthorityLevel.MEDIUM,
        factors: [
          { name: '覆盖范围', score: 95, description: '最广泛的学术文献覆盖' },
          { name: '搜索算法', score: 80, description: '强大的搜索算法' },
          { name: '透明度', score: 60, description: '算法和收录标准不透明' }
        ]
      },
      [PlatformSource.IACR]: {
        score: 80,
        level: AuthorityLevel.HIGH,
        factors: [
          { name: '密码学专注', score: 90, description: '密码学领域权威' },
          { name: '会议预印本', score: 85, description: '密码学会议预印本' },
          { name: '社区认可', score: 65, description: '密码学社区高度认可' }
        ]
      }
    };
    
    return authorityMap[source] || {
      score: 70,
      level: AuthorityLevel.MEDIUM,
      factors: [
        { name: '基础权威', score: 70, description: '基础学术平台' }
      ]
    };
  }
  
  /**
   * 计算时效性分数
   */
  static calculateRecencyScore(paper: Paper): number {
    const now = new Date();
    const monthsSincePublication = (now.getTime() - paper.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSincePublication <= 6) return 1.0;
    if (monthsSincePublication <= 12) return 0.8;
    if (monthsSincePublication <= 24) return 0.6;
    if (monthsSincePublication <= 36) return 0.4;
    if (monthsSincePublication <= 60) return 0.2;
    
    return 0.1;
  }
  
  /**
   * 计算引用速度
   */
  static calculateCitationVelocity(paper: Paper): number {
    if (!paper.citationCount || paper.citationCount === 0) {
      return 0;
    }
    
    const monthsSincePublication = (new Date().getTime() - paper.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSincePublication <= 0) return 0;
    
    return paper.citationCount / monthsSincePublication;
  }
}