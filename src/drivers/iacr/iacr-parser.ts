import { Paper, Author, PlatformSource } from '../../types/paper.js';
import { load } from 'cheerio';

export interface IacrEntry {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  year: number;
  category: string;
  pdfUrl?: string;
  psUrl?: string;
  date?: string;
}

export class IacrParser {
  static parseSearchResponse(html: string): { entries: Paper[]; total: number } {
    const $ = load(html);
    const entries: Paper[] = [];
    
    // IACR使用简单的HTML结构
    $('dt').each((_, element) => {
      const dt = $(element);
      const dd = dt.next('dd');
      
      // 提取ID和年份
      const idText = dt.text().trim();
      const idMatch = idText.match(/(\d{4})\/(\d+)/);
      if (!idMatch) return;
      
      const year = parseInt(idMatch[1], 10);
      const num = idMatch[2];
      const id = `${year}/${num}`;
      
      // 提取标题
      const title = dd.find('b').first().text().trim();
      
      // 提取作者
      const authorsText = dd.find('i').first().text();
      const authors: Author[] = authorsText
        .split(',')
        .map(name => ({ name: name.trim() }));
      
      // 提取摘要
      const abstract = dd.find('div.abs').text().trim();
      
      // 提取分类
      const category = dd.find('.cat').text().trim() || 'cryptography';
      
      // 构建URLs
      const pdfUrl = `https://eprint.iacr.org/${year}/${num}.pdf`;
      
      const paper: Paper = {
        id,
        source: PlatformSource.IACR,
        title,
        abstract: abstract || undefined,
        authors,
        publishedDate: new Date(year, 0, 1),
        categories: [category],
        urls: {
          abstract: `https://eprint.iacr.org/${year}/${num}`,
          pdf: pdfUrl,
          source: `https://eprint.iacr.org/${year}/${num}`
        },
        fullTextAvailable: true,
        metadata: {
          year,
          number: num
        }
      };
      
      entries.push(paper);
    });
    
    return { entries, total: entries.length };
  }
  
  static parsePaperResponse(html: string): Paper {
    const $ = load(html);
    
    // 提取ID
    const urlMatch = $('meta[name="citation_pdf_url"]').attr('content')?.match(/(\d{4})\/(\d+)\.pdf/);
    if (!urlMatch) {
      throw new Error('Paper not found');
    }
    
    const year = parseInt(urlMatch[1], 10);
    const num = urlMatch[2];
    const id = `${year}/${num}`;
    
    // 提取元数据
    const title = $('meta[name="citation_title"]').attr('content') || '';
    const abstract = $('meta[name="citation_abstract"]').attr('content') || '';
    
    // 提取作者
    const authors: Author[] = [];
    $('meta[name="citation_author"]').each((_, el) => {
      const name = $(el).attr('content');
      if (name) authors.push({ name });
    });
    
    const pdfUrl = `https://eprint.iacr.org/${year}/${num}.pdf`;
    
    return {
      id,
      source: PlatformSource.IACR,
      title,
      abstract: abstract || undefined,
      authors,
      publishedDate: new Date(year, 0, 1),
      categories: ['cryptography'],
      urls: {
        abstract: `https://eprint.iacr.org/${year}/${num}`,
        pdf: pdfUrl,
        source: `https://eprint.iacr.org/${year}/${num}`
      },
      fullTextAvailable: true,
      metadata: {
        year,
        number: num
      }
    };
  }
}