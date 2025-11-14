/**
 * 学术标识符提取模块
 */

import { Paper, AcademicIdentifiers } from '../../types/paper.js';

export class IdentifierExtractor {
  /**
   * 提取学术标识符
   */
  static extractAcademicIdentifiers(paper: Paper): AcademicIdentifiers {
    const identifiers: AcademicIdentifiers = {};
    
    // DOI
    if (paper.doi) {
      identifiers.doi = paper.doi;
    }
    
    // 从元数据中提取其他标识符
    if (paper.metadata) {
      if (paper.metadata.pmid) {
        identifiers.pmid = paper.metadata.pmid;
      }
      
      if (paper.metadata.pmcid) {
        identifiers.pmcid = paper.metadata.pmcid;
      }
      
      if (paper.metadata.arxivId) {
        identifiers.arxivId = paper.metadata.arxivId;
      }
      
      if (paper.metadata.isbn) {
        identifiers.isbn = paper.metadata.isbn;
      }
      
      if (paper.metadata.issn) {
        identifiers.issn = paper.metadata.issn;
      }
    }
    
    // 从来源推断ID
    if (paper.source === 'arxiv' && paper.id) {
      identifiers.arxivId = paper.id;
    } else if (paper.source === 'semantic-scholar' && paper.id) {
      identifiers.semanticScholarId = paper.id;
    } else if (paper.source === 'openalex' && paper.id) {
      identifiers.openAlexId = paper.id;
    } else if (paper.source === 'core' && paper.id) {
      identifiers.coreid = paper.id;
    }
    
    return identifiers;
  }
}