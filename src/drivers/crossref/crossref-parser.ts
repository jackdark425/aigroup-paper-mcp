import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface CrossrefWork {
  DOI: string;
  title?: string[];
  abstract?: string;
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
  }>;
  published?: {
    'date-parts'?: number[][];
  };
  'container-title'?: string[];
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  'is-referenced-by-count'?: number;
  'reference-count'?: number;
  subject?: string[];
  type?: string;
  link?: Array<{
    URL?: string;
    'content-type'?: string;
  }>;
}

export interface CrossrefResponse {
  message: {
    items: CrossrefWork[];
    'total-results': number;
  };
}

export class CrossrefParser {
  static parseSearchResponse(data: CrossrefResponse): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const results = data.message?.items || [];
    const total = data.message?.['total-results'] || 0;
    
    for (const work of results) {
      const authors: Author[] = work.author
        ? work.author.map(a => ({
            name: a.name || `${a.given || ''} ${a.family || ''}`.trim()
          }))
        : [];
      
      const publishedDate = work.published?.['date-parts']?.[0]
        ? new Date(
            work.published['date-parts'][0][0] || new Date().getFullYear(),
            (work.published['date-parts'][0][1] || 1) - 1,
            work.published['date-parts'][0][2] || 1
          )
        : new Date();
      
      const pdfUrl = work.link?.find(l => l['content-type'] === 'application/pdf')?.URL;
      
      const paper: Paper = {
        id: work.DOI,
        source: PlatformSource.CROSSREF,
        doi: work.DOI,
        title: work.title?.[0] || '',
        abstract: work.abstract,
        authors,
        publishedDate,
        journal: work['container-title']?.[0],
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        categories: work.subject || [],
        citationCount: work['is-referenced-by-count'],
        referenceCount: work['reference-count'],
        urls: {
          abstract: `https://doi.org/${work.DOI}`,
          pdf: pdfUrl,
          source: `https://doi.org/${work.DOI}`
        },
        fullTextAvailable: !!pdfUrl,
        metadata: {
          publisher: work.publisher,
          type: work.type
        }
      };
      
      entries.push(paper);
    }
    
    return { entries, total };
  }
  
  static parsePaperResponse(data: { message: CrossrefWork }): Paper {
    const work = data.message;
    
    const authors: Author[] = work.author
      ? work.author.map(a => ({
          name: a.name || `${a.given || ''} ${a.family || ''}`.trim()
        }))
      : [];
    
    const publishedDate = work.published?.['date-parts']?.[0]
      ? new Date(
          work.published['date-parts'][0][0] || new Date().getFullYear(),
          (work.published['date-parts'][0][1] || 1) - 1,
          work.published['date-parts'][0][2] || 1
        )
      : new Date();
    
    const pdfUrl = work.link?.find(l => l['content-type'] === 'application/pdf')?.URL;
    
    return {
      id: work.DOI,
      source: PlatformSource.CROSSREF,
      doi: work.DOI,
      title: work.title?.[0] || '',
      abstract: work.abstract,
      authors,
      publishedDate,
      journal: work['container-title']?.[0],
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      categories: work.subject || [],
      citationCount: work['is-referenced-by-count'],
      referenceCount: work['reference-count'],
      urls: {
        abstract: `https://doi.org/${work.DOI}`,
        pdf: pdfUrl,
        source: `https://doi.org/${work.DOI}`
      },
      fullTextAvailable: !!pdfUrl,
      metadata: {
        publisher: work.publisher,
        type: work.type
      }
    };
  }
}