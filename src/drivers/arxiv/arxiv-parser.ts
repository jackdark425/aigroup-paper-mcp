import { Paper, Author, PlatformSource } from '../../types/paper.js';
import { load } from 'cheerio';

export interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: Array<{ name: string }>;
  published: string;
  updated: string;
  links: Array<{ href: string; title?: string; rel?: string; type?: string }>;
  category?: Array<{ term: string }>;
  'arxiv:primary_category'?: { $: { term: string } };
}

export class ArxivParser {
  static parseSearchResponse(xml: string): { entries: Paper[]; total: number } {
    const $ = load(xml, { xmlMode: true });
    const entries: Paper[] = [];
    
    const totalResults = parseInt($('opensearch\\:totalResults').text() || '0', 10);
    
    $('entry').each((_, element) => {
      const entry = $(element);
      
      const id = entry.find('id').text().split('/abs/')[1] || '';
      const title = entry.find('title').text().trim();
      const summary = entry.find('summary').text().trim();
      const published = new Date(entry.find('published').text());
      const updated = new Date(entry.find('updated').text());
      
      const authors: Author[] = [];
      entry.find('author').each((_, authorEl) => {
        const name = $(authorEl).find('name').text();
        authors.push({ name });
      });
      
      const categories: string[] = [];
      entry.find('category').each((_, catEl) => {
        const term = $(catEl).attr('term');
        if (term) categories.push(term);
      });
      
      const pdfLink = entry.find('link[title="pdf"]').attr('href');
      const abstractLink = entry.find('link[rel="alternate"]').attr('href');
      
      const paper: Paper = {
        id,
        source: PlatformSource.ARXIV,
        title,
        abstract: summary,
        authors,
        publishedDate: published,
        updatedDate: updated,
        categories,
        urls: {
          abstract: abstractLink,
          pdf: pdfLink,
          source: abstractLink
        },
        fullTextAvailable: !!pdfLink,
        metadata: {}
      };
      
      entries.push(paper);
    });
    
    return { entries, total: totalResults };
  }
  
  static parsePaperResponse(xml: string): Paper {
    const $ = load(xml, { xmlMode: true });
    const entry = $('entry').first();
    
    if (!entry.length) {
      throw new Error('Paper not found');
    }
    
    const id = entry.find('id').text().split('/abs/')[1] || '';
    const title = entry.find('title').text().trim();
    const summary = entry.find('summary').text().trim();
    const published = new Date(entry.find('published').text());
    const updated = new Date(entry.find('updated').text());
    
    const authors: Author[] = [];
    entry.find('author').each((_, authorEl) => {
      const name = $(authorEl).find('name').text();
      authors.push({ name });
    });
    
    const categories: string[] = [];
    entry.find('category').each((_, catEl) => {
      const term = $(catEl).attr('term');
      if (term) categories.push(term);
    });
    
    const pdfLink = entry.find('link[title="pdf"]').attr('href');
    const abstractLink = entry.find('link[rel="alternate"]').attr('href');
    
    const paper: Paper = {
      id,
      source: PlatformSource.ARXIV,
      title,
      abstract: summary,
      authors,
      publishedDate: published,
      updatedDate: updated,
      categories,
      urls: {
        abstract: abstractLink,
        pdf: pdfLink,
        source: abstractLink
      },
      fullTextAvailable: !!pdfLink,
      metadata: {}
    };
    
    return paper;
  }
}