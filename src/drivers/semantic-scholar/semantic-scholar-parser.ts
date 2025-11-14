import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
  };
  title: string;
  abstract?: string;
  authors?: Array<{
    name: string;
    authorId?: string;
  }>;
  year?: number;
  venue?: string;
  publicationDate?: string;
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  fieldsOfStudy?: string[];
  openAccessPdf?: {
    url?: string;
  };
  isOpenAccess?: boolean;
}

export interface SemanticScholarResponse {
  total: number;
  offset: number;
  next?: number;
  data: SemanticScholarPaper[];
}

export class SemanticScholarParser {
  static parseSearchResponse(data: SemanticScholarResponse): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const results = data.data || [];
    const total = data.total || 0;
    
    for (const paper of results) {
      const authors: Author[] = paper.authors
        ? paper.authors.map(a => ({ name: a.name }))
        : [];
      
      const publishedDate = paper.publicationDate
        ? new Date(paper.publicationDate)
        : paper.year
        ? new Date(paper.year, 0, 1)
        : new Date();
      
      const paperData: Paper = {
        id: paper.paperId,
        source: PlatformSource.SEMANTIC_SCHOLAR,
        doi: paper.externalIds?.DOI,
        title: paper.title,
        abstract: paper.abstract,
        authors,
        publishedDate,
        journal: paper.venue,
        categories: paper.fieldsOfStudy || [],
        citationCount: paper.citationCount,
        referenceCount: paper.referenceCount,
        urls: {
          abstract: `https://www.semanticscholar.org/paper/${paper.paperId}`,
          pdf: paper.openAccessPdf?.url,
          source: `https://www.semanticscholar.org/paper/${paper.paperId}`
        },
        fullTextAvailable: !!paper.openAccessPdf?.url,
        metadata: {
          influentialCitationCount: paper.influentialCitationCount,
          isOpenAccess: paper.isOpenAccess,
          arxivId: paper.externalIds?.ArXiv
        }
      };
      
      entries.push(paperData);
    }
    
    return { entries, total };
  }
  
  static parsePaperResponse(data: SemanticScholarPaper): Paper {
    const authors: Author[] = data.authors
      ? data.authors.map(a => ({ name: a.name }))
      : [];
    
    const publishedDate = data.publicationDate
      ? new Date(data.publicationDate)
      : data.year
      ? new Date(data.year, 0, 1)
      : new Date();
    
    return {
      id: data.paperId,
      source: PlatformSource.SEMANTIC_SCHOLAR,
      doi: data.externalIds?.DOI,
      title: data.title,
      abstract: data.abstract,
      authors,
      publishedDate,
      journal: data.venue,
      categories: data.fieldsOfStudy || [],
      citationCount: data.citationCount,
      referenceCount: data.referenceCount,
      urls: {
        abstract: `https://www.semanticscholar.org/paper/${data.paperId}`,
        pdf: data.openAccessPdf?.url,
        source: `https://www.semanticscholar.org/paper/${data.paperId}`
      },
      fullTextAvailable: !!data.openAccessPdf?.url,
      metadata: {
        influentialCitationCount: data.influentialCitationCount,
        isOpenAccess: data.isOpenAccess,
        arxivId: data.externalIds?.ArXiv
      }
    };
  }
}