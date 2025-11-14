import { Paper, Author, PlatformSource } from '../../types/paper.js';
import { load } from 'cheerio';

export interface PubmedArticle {
  pmid: string;
  doi?: string;
  title: string;
  abstract?: string;
  authors?: string[];
  journal?: string;
  pubDate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

export class PubmedParser {
  static parseSearchResponse(xml: string): { entries: Paper[]; total: number } {
    const $ = load(xml, { xmlMode: true });
    const entries: Paper[] = [];
    
    const totalResults = parseInt($('Count').text() || '0', 10);
    
    $('PubmedArticle').each((_, element) => {
      const article = $(element);
      
      const pmid = article.find('PMID').first().text();
      const title = article.find('ArticleTitle').text().trim();
      const abstract = article.find('AbstractText').text().trim();
      const journal = article.find('Title').first().text();
      
      // 解析作者
      const authors: Author[] = [];
      article.find('Author').each((_, authorEl) => {
        const lastName = $(authorEl).find('LastName').text();
        const foreName = $(authorEl).find('ForeName').text();
        const name = `${foreName} ${lastName}`.trim();
        if (name) authors.push({ name });
      });
      
      // 解析发表日期
      const year = article.find('PubDate Year').text() || article.find('MedlineDate').text().split(' ')[0];
      const month = article.find('PubDate Month').text() || '01';
      const day = article.find('PubDate Day').text() || '01';
      const publishedDate = new Date(`${year}-${month}-${day}`);
      
      // 查找DOI
      let doi: string | undefined;
      article.find('ArticleId').each((_, idEl) => {
        const idType = $(idEl).attr('IdType');
        if (idType === 'doi') {
          doi = $(idEl).text();
        }
      });
      
      const paper: Paper = {
        id: pmid,
        source: PlatformSource.PUBMED,
        doi,
        title,
        abstract: abstract || undefined,
        authors,
        publishedDate,
        journal,
        volume: article.find('Volume').text() || undefined,
        issue: article.find('Issue').text() || undefined,
        pages: article.find('MedlinePgn').text() || undefined,
        categories: [],
        urls: {
          abstract: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        },
        fullTextAvailable: false,
        metadata: {
          pmid
        }
      };
      
      entries.push(paper);
    });
    
    return { entries, total: totalResults };
  }
  
  static parsePaperResponse(xml: string): Paper {
    const $ = load(xml, { xmlMode: true });
    const article = $('PubmedArticle').first();
    
    if (!article.length) {
      throw new Error('Paper not found');
    }
    
    const pmid = article.find('PMID').first().text();
    const title = article.find('ArticleTitle').text().trim();
    const abstract = article.find('AbstractText').text().trim();
    const journal = article.find('Title').first().text();
    
    const authors: Author[] = [];
    article.find('Author').each((_, authorEl) => {
      const lastName = $(authorEl).find('LastName').text();
      const foreName = $(authorEl).find('ForeName').text();
      const name = `${foreName} ${lastName}`.trim();
      if (name) authors.push({ name });
    });
    
    const year = article.find('PubDate Year').text() || article.find('MedlineDate').text().split(' ')[0];
    const month = article.find('PubDate Month').text() || '01';
    const day = article.find('PubDate Day').text() || '01';
    const publishedDate = new Date(`${year}-${month}-${day}`);
    
    let doi: string | undefined;
    article.find('ArticleId').each((_, idEl) => {
      const idType = $(idEl).attr('IdType');
      if (idType === 'doi') {
        doi = $(idEl).text();
      }
    });
    
    return {
      id: pmid,
      source: PlatformSource.PUBMED,
      doi,
      title,
      abstract: abstract || undefined,
      authors,
      publishedDate,
      journal,
      volume: article.find('Volume').text() || undefined,
      issue: article.find('Issue').text() || undefined,
      pages: article.find('MedlinePgn').text() || undefined,
      categories: [],
      urls: {
        abstract: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        source: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      },
      fullTextAvailable: false,
      metadata: {
        pmid
      }
    };
  }
}
