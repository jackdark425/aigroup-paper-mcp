/**
 * 元数据增强模块 - 主入口
 * 提供引用格式生成、全文可用性检测、引用数据分析等功能
 */

import { 
  Paper, 
  CitationFormats,
  FullTextDetails,
  CitationTrends,
  AcademicIdentifiers,
  DataQualityMetrics
} from '../types/paper.js';

import { CitationGenerator } from './metadata/citation-generator.js';
import { FullTextAnalyzer } from './metadata/fulltext-analyzer.js';
import { CitationTrendsAnalyzer } from './metadata/citation-trends.js';
import { IdentifierExtractor } from './metadata/identifier-extractor.js';
import { QualityAssessor } from './metadata/quality-assessor.js';

/**
 * 元数据增强器类 - 统一的入口点
 */
export class MetadataEnhancer {
  /**
   * 生成所有引用格式
   */
  static generateCitations(paper: Paper): CitationFormats {
    return CitationGenerator.generateCitations(paper);
  }
  
  /**
   * 生成BibTeX格式引用
   */
  static generateBibTeX(paper: Paper): string {
    return CitationGenerator.generateBibTeX(paper);
  }
  
  /**
   * 生成APA格式引用
   */
  static generateAPA(paper: Paper): string {
    return CitationGenerator.generateAPA(paper);
  }
  
  /**
   * 生成MLA格式引用
   */
  static generateMLA(paper: Paper): string {
    return CitationGenerator.generateMLA(paper);
  }
  
  /**
   * 生成Chicago格式引用
   */
  static generateChicago(paper: Paper): string {
    return CitationGenerator.generateChicago(paper);
  }
  
  /**
   * 生成IEEE格式引用
   */
  static generateIEEE(paper: Paper): string {
    return CitationGenerator.generateIEEE(paper);
  }
  
  /**
   * 生成Harvard格式引用
   */
  static generateHarvard(paper: Paper): string {
    return CitationGenerator.generateHarvard(paper);
  }
  
  /**
   * 增强全文可用性检测
   */
  static enhanceFullTextAvailability(paper: Paper): FullTextDetails {
    return FullTextAnalyzer.enhanceFullTextAvailability(paper);
  }
  
  /**
   * 分析引用趋势
   */
  static analyzeCitationTrends(paper: Paper): CitationTrends | undefined {
    return CitationTrendsAnalyzer.analyzeCitationTrends(paper);
  }
  
  /**
   * 提取学术标识符
   */
  static extractAcademicIdentifiers(paper: Paper): AcademicIdentifiers {
    return IdentifierExtractor.extractAcademicIdentifiers(paper);
  }
  
  /**
   * 评估数据质量
   */
  static assessDataQuality(paper: Paper): DataQualityMetrics {
    return QualityAssessor.assessDataQuality(paper);
  }
}