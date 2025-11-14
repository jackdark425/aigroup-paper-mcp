import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface BiorxivResult {
  doi: string;
  title: string;
  authors: string;
  author_corresponding?: string;
  author_corresponding_institution?: string;
  date: string;
  version?: string;
  type?: string;
  license?: string;
  category: string;
  jatsxml?: string;
  abstract?: string;
  published?: string;
  server?: string;
}

export interface BiorxivResponse {
  messages?: Array<{
    status: string;
    total?: number;
  }>;
  collection?: BiorxivResult[];
}

export class BiorxivParser {
  static parseSearchResponse(data: BiorxivResponse, source: PlatformSource): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const results = data.collection || [];
    const total = data.messages?.[0]?.total || results.length;
    
    for (const result of results) {
      const authors: Author[] = result.authors
        ? result.authors.split(';').map(name => ({ name: name.trim() }))
        : [];
      
      const paperId = result.doi.split('/').pop() || result.doi;
      
      const paper: Paper = {
        id: paperId,
        source,
        doi: result.doi,
        title: result.title,
        abstract: result.abstract,
        authors,
        publishedDate: new Date(result.date),
        categories: [result.category],
        license: result.license,
        version: result.version,
        urls: {
          abstract: `https://${source}.org/content/${result.doi}`,
          pdf: `https://${source}.org/content/${result.doi}.full.pdf`,
          source: `https://${source}.org/content/${result.doi}`
        },
        fullTextAvailable: true,
        metadata: {
          server: result.server || source,
          type: result.type
        }
      };
      
      entries.push(paper);
    }
    
    return { entries, total };
  }
  
  static parsePaperResponse(data: BiorxivResponse, source: PlatformSource): Paper {
    const result = data.collection?.[0];
    
    if (!result) {
      throw new Error('Paper not found');
    }
    
    const authors: Author[] = result.authors
      ? result.authors.split(';').map(name => ({ name: name.trim() }))
      : [];
    
    const paperId = result.doi.split('/').pop() || result.doi;
    
    return {
      id: paperId,
      source,
      doi: result.doi,
      title: result.title,
      abstract: result.abstract,
      authors,
      publishedDate: new Date(result.date),
      categories: [result.category],
      license: result.license,
      version: result.version,
      urls: {
        abstract: `https://${source}.org/content/${result.doi}`,
        pdf: `https://${source}.org/content/${result.doi}.full.pdf`,
        source: `https://${source}.org/content/${result.doi}`
      },
      fullTextAvailable: true,
      metadata: {
        server: result.server || source,
        type: result.type
      }
    };
  }
}