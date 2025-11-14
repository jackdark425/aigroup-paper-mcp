/**
 * 引用格式生成模块
 */

import { Paper, CitationFormats } from '../../types/paper.js';

export class CitationGenerator {
  /**
   * 生成所有引用格式
   */
  static generateCitations(paper: Paper): CitationFormats {
    return {
      bibtex: this.generateBibTeX(paper),
      apa: this.generateAPA(paper),
      mla: this.generateMLA(paper),
      chicago: this.generateChicago(paper),
      ieee: this.generateIEEE(paper),
      harvard: this.generateHarvard(paper)
    };
  }
  
  /**
   * 生成BibTeX格式引用
   */
  static generateBibTeX(paper: Paper): string {
    const year = paper.publishedDate.getFullYear();
    const authors = paper.authors.map(a => a.name).join(' and ');
    const firstAuthor = paper.authors[0]?.name.split(' ').pop() || 'Unknown';
    const key = `${firstAuthor}${year}`;
    
    let bibtex = '@article{' + key + ',\n';
    bibtex += `  title = {${this.escapeBibTeX(paper.title)}},\n`;
    bibtex += `  author = {${authors}},\n`;
    bibtex += `  year = {${year}},\n`;
    
    if (paper.journal) {
      bibtex += `  journal = {${this.escapeBibTeX(paper.journal)}},\n`;
    }
    
    if (paper.volume) {
      bibtex += `  volume = {${paper.volume}},\n`;
    }
    
    if (paper.issue) {
      bibtex += `  number = {${paper.issue}},\n`;
    }
    
    if (paper.pages) {
      bibtex += `  pages = {${paper.pages}},\n`;
    }
    
    if (paper.doi) {
      bibtex += `  doi = {${paper.doi}},\n`;
    }
    
    if (paper.urls.abstract) {
      bibtex += `  url = {${paper.urls.abstract}},\n`;
    }
    
    bibtex = bibtex.replace(/,\n$/, '\n');
    bibtex += '}';
    
    return bibtex;
  }
  
  /**
   * 生成APA格式引用
   */
  static generateAPA(paper: Paper): string {
    const year = paper.publishedDate.getFullYear();
    const authors = this.formatAPAAuthors(paper.authors.map(a => a.name));
    
    let citation = `${authors} (${year}). ${paper.title}.`;
    
    if (paper.journal) {
      citation += ` ${this.formatItalic(paper.journal)}`;
      
      if (paper.volume) {
        citation += `, ${this.formatItalic(paper.volume)}`;
      }
      
      if (paper.issue) {
        citation += `(${paper.issue})`;
      }
      
      if (paper.pages) {
        citation += `, ${paper.pages}`;
      }
      
      citation += '.';
    }
    
    if (paper.doi) {
      citation += ` https://doi.org/${paper.doi}`;
    } else if (paper.urls.abstract) {
      citation += ` ${paper.urls.abstract}`;
    }
    
    return citation;
  }
  
  /**
   * 生成MLA格式引用
   */
  static generateMLA(paper: Paper): string {
    const authors = paper.authors.map(a => a.name);
    let citation = '';
    
    if (authors.length > 0) {
      const firstAuthor = authors[0].split(' ');
      const lastName = firstAuthor[firstAuthor.length - 1];
      const firstName = firstAuthor.slice(0, -1).join(' ');
      citation += `${lastName}, ${firstName}`;
      
      if (authors.length > 1) {
        citation += ', et al';
      }
      citation += '. ';
    }
    
    citation += `"${paper.title}."`;
    
    if (paper.journal) {
      citation += ` ${this.formatItalic(paper.journal)}`;
      
      if (paper.volume) {
        citation += `, vol. ${paper.volume}`;
      }
      
      if (paper.issue) {
        citation += `, no. ${paper.issue}`;
      }
      
      citation += `, ${paper.publishedDate.getFullYear()}`;
      
      if (paper.pages) {
        citation += `, pp. ${paper.pages}`;
      }
      
      citation += '.';
    }
    
    if (paper.doi) {
      citation += ` doi:${paper.doi}.`;
    }
    
    return citation;
  }
  
  /**
   * 生成Chicago格式引用
   */
  static generateChicago(paper: Paper): string {
    const authors = paper.authors.map(a => a.name);
    let citation = '';
    
    if (authors.length > 0) {
      const firstAuthor = authors[0].split(' ');
      const lastName = firstAuthor[firstAuthor.length - 1];
      const firstName = firstAuthor.slice(0, -1).join(' ');
      citation += `${lastName}, ${firstName}`;
      
      if (authors.length > 1) {
        citation += ', et al';
      }
      citation += '. ';
    }
    
    citation += `"${paper.title}."`;
    
    if (paper.journal) {
      citation += ` ${this.formatItalic(paper.journal)}`;
      
      if (paper.volume) {
        citation += ` ${paper.volume}`;
      }
      
      if (paper.issue) {
        citation += `, no. ${paper.issue}`;
      }
      
      citation += ` (${paper.publishedDate.getFullYear()})`;
      
      if (paper.pages) {
        citation += `: ${paper.pages}`;
      }
      
      citation += '.';
    }
    
    if (paper.doi) {
      citation += ` https://doi.org/${paper.doi}.`;
    }
    
    return citation;
  }
  
  /**
   * 生成IEEE格式引用
   */
  static generateIEEE(paper: Paper): string {
    const authors = this.formatIEEEAuthors(paper.authors.map(a => a.name));
    let citation = `${authors}, `;
    citation += `"${paper.title},"`;
    
    if (paper.journal) {
      citation += ` ${this.formatItalic(paper.journal)}`;
      
      if (paper.volume) {
        citation += `, vol. ${paper.volume}`;
      }
      
      if (paper.issue) {
        citation += `, no. ${paper.issue}`;
      }
      
      if (paper.pages) {
        citation += `, pp. ${paper.pages}`;
      }
      
      citation += `, ${paper.publishedDate.getFullYear()}.`;
    }
    
    if (paper.doi) {
      citation += ` doi: ${paper.doi}.`;
    }
    
    return citation;
  }
  
  /**
   * 生成Harvard格式引用
   */
  static generateHarvard(paper: Paper): string {
    const year = paper.publishedDate.getFullYear();
    const authors = this.formatHarvardAuthors(paper.authors.map(a => a.name));
    
    let citation = `${authors} ${year}, `;
    citation += `'${paper.title}'`;
    
    if (paper.journal) {
      citation += `, ${this.formatItalic(paper.journal)}`;
      
      if (paper.volume) {
        citation += `, vol. ${paper.volume}`;
      }
      
      if (paper.issue) {
        citation += `, no. ${paper.issue}`;
      }
      
      if (paper.pages) {
        citation += `, pp. ${paper.pages}`;
      }
      
      citation += '.';
    }
    
    if (paper.doi) {
      citation += ` Available at: https://doi.org/${paper.doi}.`;
    }
    
    return citation;
  }

  // 格式化辅助方法
  private static escapeBibTeX(text: string): string {
    return text
      .replace(/[{}]/g, '')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%');
  }
  
  private static formatAPAAuthors(authors: string[]): string {
    if (authors.length === 0) return 'Unknown';
    
    if (authors.length === 1) {
      return this.formatAuthorLastFirst(authors[0]);
    }
    
    if (authors.length === 2) {
      return `${this.formatAuthorLastFirst(authors[0])}, & ${this.formatAuthorLastFirst(authors[1])}`;
    }
    
    const formatted = authors.slice(0, -1).map(a => this.formatAuthorLastFirst(a));
    return `${formatted.join(', ')}, & ${this.formatAuthorLastFirst(authors[authors.length - 1])}`;
  }
  
  private static formatIEEEAuthors(authors: string[]): string {
    if (authors.length === 0) return 'Unknown';
    
    const initials = authors.map(a => this.getAuthorInitials(a));
    
    if (initials.length <= 3) {
      return initials.join(', ');
    }
    
    return `${initials[0]} et al.`;
  }
  
  private static formatHarvardAuthors(authors: string[]): string {
    if (authors.length === 0) return 'Unknown';
    
    if (authors.length === 1) {
      return this.formatAuthorLastFirst(authors[0]);
    }
    
    if (authors.length === 2) {
      return `${this.formatAuthorLastFirst(authors[0])} and ${this.formatAuthorLastFirst(authors[1])}`;
    }
    
    return `${this.formatAuthorLastFirst(authors[0])} et al.`;
  }
  
  private static formatAuthorLastFirst(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name;
    
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    const initials = firstName.split(' ')
      .map(n => n.charAt(0).toUpperCase() + '.')
      .join(' ');
    
    return `${lastName}, ${initials}`;
  }
  
  private static getAuthorInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name;
    
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1)
      .map(n => n.charAt(0).toUpperCase() + '.')
      .join(' ');
    
    return `${initials} ${lastName}`;
  }
  
  private static formatItalic(text: string): string {
    return `*${text}*`;
  }
}