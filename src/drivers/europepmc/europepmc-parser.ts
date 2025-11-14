import { Paper, Author, PlatformSource } from '../../types/paper.js';

export interface EuropePmcResult {
  id: string;
  source: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  abstractText?: string;
  citedByCount?: number;
  fullTextUrlList?: {
    fullTextUrl?: Array<{
      url?: string;
      documentStyle?: string;
    }>;
  };
}

export interface EuropePmcResponse {
  resultList?: {
    result?: EuropePmcResult[];
  };
  hitCount?: number;
}

export class EuropePmcParser {
  static parseSearchResponse(data: EuropePmcResponse): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const results = data.resultList?.result || [];
    const total = data.hitCount || 0;
    
    for (const result of results) {
      const authors: Author[] = result.authorString
        ? result.authorString.split(',').map(name => ({ name: name.trim() }))
        : [];
      
      const pdfUrl = result.fullTextUrlList?.fullTextUrl?.find(
        url => url.documentStyle === 'pdf'
      )?.url;
      
      const htmlUrl = result.fullTextUrlList?.fullTextUrl?.find(
        url => url.documentStyle === 'html'
      )?.url;
      
      const paper: Paper = {
        id: result.id,
        source: PlatformSource.EUROPEPMC,
        doi: result.doi || undefined,
        title: result.title,
        abstract: result.abstractText || undefined,
        authors,
        publishedDate: new Date(result.pubYear || Date.now()),
        journal: result.journalTitle || undefined,
        categories: [],
        citationCount: result.citedByCount,
        urls: {
          abstract: `https://europepmc.org/article/${result.source}/${result.id}`,
          pdf: pdfUrl,
          html: htmlUrl,
          source: `https://europepmc.org/article/${result.source}/${result.id}`
        },
        fullTextAvailable: !!(pdfUrl || htmlUrl),
        metadata: {
          pmid: result.pmid,
          pmcid: result.pmcid,
          europePmcSource: result.source
        }
      };
      
      entries.push(paper);
    }
    
    return { entries, total };
  }
  
  static parsePaperResponse(data: any): Paper {
    const result = data.resultList?.result?.[0];
    
    if (!result) {
      throw new Error('Paper not found');
    }
    
    const authors: Author[] = result.authorString
      ? result.authorString.split(',').map((name: string) => ({ name: name.trim() }))
      : [];
    
    const pdfUrl = result.fullTextUrlList?.fullTextUrl?.find(
      (url: any) => url.documentStyle === 'pdf'
    )?.url;
    
    const htmlUrl = result.fullTextUrlList?.fullTextUrl?.find(
      (url: any) => url.documentStyle === 'html'
    )?.url;
    
    return {
      id: result.id,
      source: PlatformSource.EUROPEPMC,
      doi: result.doi || undefined,
      title: result.title,
      abstract: result.abstractText || undefined,
      authors,
      publishedDate: new Date(result.pubYear || Date.now()),
      journal: result.journalTitle || undefined,
      categories: [],
      citationCount: result.citedByCount,
      urls: {
        abstract: `https://europepmc.org/article/${result.source}/${result.id}`,
        pdf: pdfUrl,
        html: htmlUrl,
        source: `https://europepmc.org/article/${result.source}/${result.id}`
      },
      fullTextAvailable: !!(pdfUrl || htmlUrl),
      metadata: {
        pmid: result.pmid,
        pmcid: result.pmcid,
        europePmcSource: result.source
      }
    };
  }
}