import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface CoreWork {
  id: string;
  doi?: string;
  title: string;
  authors?: Array<{ name: string }>;
  abstract?: string;
  yearPublished?: number;
  publisher?: string;
  language?: string;
  downloadUrl?: string;
  fullTextIdentifier?: string;
  oai?: string;
  citationCount?: number;
  topics?: string[];
}

export interface CoreResponse {
  totalHits: number;
  results?: CoreWork[];
}

export class CoreParser {
  static parseSearchResponse(data: CoreResponse): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const results = data.results || [];
    const total = data.totalHits || 0;
    
    for (const work of results) {
      const authors: Author[] = work.authors
        ? work.authors.map(a => ({ name: a.name }))
        : [];
      
      const paper: Paper = {
        id: work.id,
        source: PlatformSource.CORE,
        doi: work.doi,
        title: work.title,
        abstract: work.abstract,
        authors,
        publishedDate: new Date(work.yearPublished || Date.now()),
        categories: work.topics || [],
        citationCount: work.citationCount,
        language: work.language,
        urls: {
          abstract: `https://core.ac.uk/display/${work.id}`,
          pdf: work.downloadUrl,
          source: `https://core.ac.uk/display/${work.id}`
        },
        fullTextAvailable: !!work.downloadUrl,
        metadata: {
          publisher: work.publisher,
          oai: work.oai
        }
      };
      
      entries.push(paper);
    }
    
    return { entries, total };
  }
  
  static parsePaperResponse(data: any): Paper {
    const work = data;
    
    if (!work) {
      throw new Error('Paper not found');
    }
    
    const authors: Author[] = work.authors
      ? work.authors.map((a: any) => ({ name: a.name }))
      : [];
    
    return {
      id: work.id,
      source: PlatformSource.CORE,
      doi: work.doi,
      title: work.title,
      abstract: work.abstract,
      authors,
      publishedDate: new Date(work.yearPublished || Date.now()),
      categories: work.topics || [],
      citationCount: work.citationCount,
      language: work.language,
      urls: {
        abstract: `https://core.ac.uk/display/${work.id}`,
        pdf: work.downloadUrl,
        source: `https://core.ac.uk/display/${work.id}`
      },
      fullTextAvailable: !!work.downloadUrl,
      metadata: {
        publisher: work.publisher,
        oai: work.oai
      }
    };
  }
}