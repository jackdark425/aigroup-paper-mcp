import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface GoogleScholarResult {
  title: string;
  link?: string;
  snippet?: string;
  authors?: string;
  year?: string;
  citedBy?: number;
  relatedUrl?: string;
  versions?: number;
}

export class GoogleScholarParser {
  static parseSearchResponse(results: GoogleScholarResult[]): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    
    for (const result of results) {
      const authors: Author[] = result.authors
        ? result.authors.split(',').map(name => ({ name: name.trim() }))
        : [];
      
      const year = result.year ? parseInt(result.year, 10) : new Date().getFullYear();
      const publishedDate = new Date(year, 0, 1);
      
      // 从链接中提取ID
      const id = result.link?.split('=').pop() || `gs-${Date.now()}`;
      
      const paper: Paper = {
        id,
        source: PlatformSource.GOOGLE_SCHOLAR,
        title: result.title,
        abstract: result.snippet,
        authors,
        publishedDate,
        categories: [],
        citationCount: result.citedBy,
        urls: {
          abstract: result.link,
          source: result.link
        },
        fullTextAvailable: false,
        metadata: {
          versions: result.versions,
          relatedUrl: result.relatedUrl
        }
      };
      
      entries.push(paper);
    }
    
    return { entries, total: entries.length };
  }
  
  static parsePaperResponse(result: GoogleScholarResult): Paper {
    const authors: Author[] = result.authors
      ? result.authors.split(',').map(name => ({ name: name.trim() }))
      : [];
    
    const year = result.year ? parseInt(result.year, 10) : new Date().getFullYear();
    const publishedDate = new Date(year, 0, 1);
    
    const id = result.link?.split('=').pop() || `gs-${Date.now()}`;
    
    return {
      id,
      source: PlatformSource.GOOGLE_SCHOLAR,
      title: result.title,
      abstract: result.snippet,
      authors,
      publishedDate,
      categories: [],
      citationCount: result.citedBy,
      urls: {
        abstract: result.link,
        source: result.link
      },
      fullTextAvailable: false,
      metadata: {
        versions: result.versions,
        relatedUrl: result.relatedUrl
      }
    };
  }
}