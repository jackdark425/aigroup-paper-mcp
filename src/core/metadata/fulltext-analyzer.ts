/**
 * 全文可用性分析模块
 */

import { 
  Paper, 
  FullTextDetails,
  FullTextUrl,
  FullTextFormat,
  AccessType
} from '../../types/paper.js';

export class FullTextAnalyzer {
  /**
   * 增强全文可用性检测
   */
  static enhanceFullTextAvailability(paper: Paper): FullTextDetails {
    const urls: FullTextUrl[] = [];
    
    // 检测PDF链接
    if (paper.urls.pdf) {
      urls.push({
        url: paper.urls.pdf,
        format: FullTextFormat.PDF,
        primary: true
      });
    }
    
    // 检测HTML链接
    if (paper.urls.html) {
      urls.push({
        url: paper.urls.html,
        format: FullTextFormat.HTML,
        primary: !paper.urls.pdf
      });
    }
    
    // 确定访问类型
    const accessType = this.determineAccessType(paper);
    
    // 检测是否可下载
    const downloadable = Boolean(paper.urls.pdf);
    
    return {
      available: paper.fullTextAvailable,
      url: paper.urls.pdf || paper.urls.html,
      urls,
      type: paper.urls.pdf ? FullTextFormat.PDF : 
            paper.urls.html ? FullTextFormat.HTML : undefined,
      license: paper.license,
      accessType,
      verifiedAt: new Date(),
      downloadable,
      version: paper.version
    };
  }
  
  /**
   * 确定访问类型
   */
  private static determineAccessType(paper: Paper): AccessType {
    // 检查许可证
    if (paper.license) {
      const licenseLower = paper.license.toLowerCase();
      
      if (licenseLower.includes('creative commons') || 
          licenseLower.includes('cc-by') ||
          licenseLower.includes('open access')) {
        return AccessType.OPEN_ACCESS;
      }
    }
    
    // 检查来源平台
    const openAccessPlatforms = ['arxiv', 'biorxiv', 'medrxiv', 'pmc'];
    if (openAccessPlatforms.includes(paper.source)) {
      return AccessType.OPEN_ACCESS;
    }
    
    // 检查URL
    if (paper.urls.pdf) {
      const pdfUrl = paper.urls.pdf.toLowerCase();
      if (pdfUrl.includes('arxiv') || 
          pdfUrl.includes('biorxiv') || 
          pdfUrl.includes('medrxiv') ||
          pdfUrl.includes('pmc')) {
        return AccessType.OPEN_ACCESS;
      }
      
      if (pdfUrl.includes('paywall') || pdfUrl.includes('subscription')) {
        return AccessType.SUBSCRIPTION;
      }
    }
    
    // 如果有全文但不确定类型
    if (paper.fullTextAvailable) {
      return AccessType.FREE;
    }
    
    return AccessType.CLOSED;
  }
}