import { Paper, Author, PlatformSource } from '../../types/paper.js';
import { load } from 'cheerio';

/**
 * PMC esummary API响应的单篇文章结构
 */
export interface PmcSummaryArticle {
  uid: string;
  pubdate?: string;
  epubdate?: string;
  source?: string;
  authors?: Array<{
    name: string;
    authtype: string;
  }>;
  title?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  sortfirstauthor?: string;
  fulljournalname?: string;
  articleids?: Array<{
    idtype: string;
    value: string;
  }>;
  pmcid?: string;
}

/**
 * PMC esummary API响应结构
 */
export interface PmcSummaryResponse {
  result?: {
    uids?: string[];
    [key: string]: any;
  };
}

export class PmcParser {
  /**
   * 解析esummary API的搜索响应（JSON格式）
   */
  static parseSearchResponse(data: PmcSummaryResponse): { entries: Paper[]; total: number } {
    const entries: Paper[] = [];
    const result = data.result;
    
    if (!result || !result.uids) {
      return { entries: [], total: 0 };
    }
    
    const uids = result.uids;
    
    for (const uid of uids) {
      const article = result[uid] as PmcSummaryArticle;
      if (!article || typeof article !== 'object') continue;
      
      const paper = this.parseSummaryArticle(article);
      entries.push(paper);
    }
    
    return { entries, total: entries.length };
  }
  
  /**
   * 解析单篇文章摘要
   */
  static parseSummaryArticle(article: PmcSummaryArticle): Paper {
    // 解析作者
    const authors: Author[] = (article.authors || []).map(author => ({
      name: author.name
    }));
    
    // 获取DOI和PMID
    const articleIds = article.articleids || [];
    const doi = articleIds.find(id => id.idtype === 'doi')?.value;
    const pmid = articleIds.find(id => id.idtype === 'pmid')?.value;
    const pmcid = article.pmcid || article.uid;
    
    // 解析发布日期
    const pubDate = article.epubdate || article.pubdate || '';
    let publishedDate: Date;
    try {
      publishedDate = pubDate ? new Date(pubDate) : new Date();
    } catch {
      publishedDate = new Date();
    }
    
    const paper: Paper = {
      id: pmcid,
      source: PlatformSource.PMC,
      doi: doi || undefined,
      title: article.title || 'Untitled',
      abstract: undefined, // esummary不提供摘要
      authors,
      publishedDate,
      journal: article.fulljournalname || article.source || undefined,
      volume: article.volume || undefined,
      issue: article.issue || undefined,
      pages: article.pages || undefined,
      categories: [],
      urls: {
        abstract: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
        source: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
      },
      fullTextAvailable: true, // PMC所有文章都有全文
      metadata: {
        pmid: pmid || undefined,
        pmcid
      }
    };
    
    return paper;
  }
  
  /**
   * 解析efetch API的论文详情（JATS XML格式）
   * 用于获取完整的文章内容和摘要
   */
  static parsePaperResponse(xml: string): Paper {
    const $ = load(xml, { xmlMode: true });
    const article = $('article').first();
    
    if (!article.length) {
      throw new Error('Paper not found in XML response');
    }
    
    // 从article-meta中提取元数据
    const meta = article.find('article-meta');
    
    // 获取PMC ID
    const pmcid = meta.find('article-id[pub-id-type="pmc"]').text() || 
                  meta.find('article-id[pub-id-type="pmcid"]').text();
    const pmid = meta.find('article-id[pub-id-type="pmid"]').text();
    const doi = meta.find('article-id[pub-id-type="doi"]').text();
    
    // 获取标题
    const title = meta.find('title-group article-title').text().trim() || 
                  article.find('front article-title').text().trim();
    
    // 获取摘要
    const abstractNode = article.find('abstract');
    let abstract = '';
    if (abstractNode.length) {
      // 处理结构化摘要
      abstractNode.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) abstract += text + '\n\n';
      });
      abstract = abstract.trim() || abstractNode.text().trim();
    }
    
    // 解析作者
    const authors: Author[] = [];
    meta.find('contrib[contrib-type="author"]').each((_, el) => {
      const contrib = $(el);
      const surname = contrib.find('surname').text();
      const givenNames = contrib.find('given-names').text();
      const name = givenNames ? `${givenNames} ${surname}` : surname;
      
      if (name) {
        const affiliations: string[] = [];
        contrib.find('aff').each((_, affEl) => {
          const aff = $(affEl).text().trim();
          if (aff) affiliations.push(aff);
        });
        
        authors.push({
          name: name.trim(),
          affiliations: affiliations.length > 0 ? affiliations : undefined
        });
      }
    });
    
    // 获取期刊信息
    const journalMeta = article.find('journal-meta');
    const journal = journalMeta.find('journal-title').text() ||
                    journalMeta.find('journal-id[journal-id-type="nlm-ta"]').text();
    
    // 获取发布日期
    const pubDateNode = meta.find('pub-date[pub-type="epub"], pub-date[pub-type="ppub"]').first();
    let publishedDate = new Date();
    if (pubDateNode.length) {
      const year = pubDateNode.find('year').text();
      const month = pubDateNode.find('month').text() || '1';
      const day = pubDateNode.find('day').text() || '1';
      try {
        publishedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } catch {
        publishedDate = new Date();
      }
    }
    
    // 获取卷号、期号、页码
    const volume = meta.find('volume').text();
    const issue = meta.find('issue').text();
    const fpage = meta.find('fpage').text();
    const lpage = meta.find('lpage').text();
    const pages = fpage && lpage ? `${fpage}-${lpage}` : (fpage || lpage || undefined);
    
    // 获取关键词
    const keywords: string[] = [];
    meta.find('kwd-group kwd').each((_, el) => {
      const kwd = $(el).text().trim();
      if (kwd) keywords.push(kwd);
    });
    
    const paper: Paper = {
      id: pmcid,
      source: PlatformSource.PMC,
      doi: doi || undefined,
      title,
      abstract: abstract || undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      authors,
      publishedDate,
      journal: journal || undefined,
      volume: volume || undefined,
      issue: issue || undefined,
      pages: pages || undefined,
      categories: [],
      urls: {
        abstract: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
        pdf: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
        html: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
        source: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
      },
      fullTextAvailable: true,
      metadata: {
        pmid: pmid || undefined,
        pmcid
      }
    };
    
    return paper;
  }
}