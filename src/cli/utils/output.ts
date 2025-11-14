/**
 * 输出格式化工具模块
 */

import { Paper, AccessType } from '../../types/paper.js';

export function outputResults(result: any, format: string) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(result, null, 2));
      break;
    case 'csv':
      outputCSV(result.papers);
      break;
    case 'table':
    default:
      outputTable(result.papers);
      outputEnhancedStats(result.enhancedStats);
      break;
  }
}

export function outputPaper(paper: any, format: string) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(paper, null, 2));
      break;
    case 'bibtex':
      if (paper.citations?.bibtex) {
        console.log(paper.citations.bibtex);
      } else {
        console.log('BibTeX citation not available');
      }
      break;
    case 'apa':
      if (paper.citations?.apa) {
        console.log(paper.citations.apa);
      } else {
        console.log('APA citation not available');
      }
      break;
    case 'mla':
      if (paper.citations?.mla) {
        console.log(paper.citations.mla);
      } else {
        console.log('MLA citation not available');
      }
      break;
    case 'table':
    default:
      outputDetailedPaper(paper);
      break;
  }
}

export function outputPapers(papers: any[], format: string) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(papers, null, 2));
      break;
    case 'csv':
      outputCSV(papers);
      break;
    case 'table':
    default:
      outputTable(papers);
      break;
  }
}

export function outputCategories(categories: any, format: string) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(categories, null, 2));
      break;
    case 'table':
    default:
      console.log('\n📚 Available Categories:');
      
      if (categories.platforms && Array.isArray(categories.platforms)) {
        categories.platforms.forEach((platform: any) => {
          console.log(`\n${platform.name || platform.source.toUpperCase()}:`);
          if (platform.categories && Array.isArray(platform.categories)) {
            platform.categories.forEach((cat: any) => {
              console.log(`  - ${cat.name} (${cat.count || 'N/A'} papers)`);
            });
          } else {
            console.log(`  No categories available`);
          }
        });
      }
      
      if (categories.errors && categories.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        categories.errors.forEach((error: string) => {
          console.log(`  - ${error}`);
        });
      }
      break;
  }
}

export function outputTrends(trends: any, format: string) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(trends, null, 2));
      break;
    case 'chart':
      console.log('\n📈 Topic Trends:');
      if (trends.dataPoints && Array.isArray(trends.dataPoints)) {
        trends.dataPoints.forEach((point: any) => {
          const bar = '█'.repeat(Math.floor(point.count / 10));
          console.log(`${point.period}: ${bar} ${point.count}`);
        });
      }
      break;
    case 'table':
    default:
      console.log('\n📈 Topic Trends:');
      console.log('Period\t\tCount\tGrowth');
      if (trends.dataPoints && Array.isArray(trends.dataPoints)) {
        trends.dataPoints.forEach((point: any, index: number) => {
          const growth = index > 0 ? 
            `+${(((point.count - trends.dataPoints[index-1].count) / trends.dataPoints[index-1].count) * 100).toFixed(1)}%` : 
            'N/A';
          console.log(`${point.period}\t${point.count}\t${growth}`);
        });
      }
      
      if (trends.insights && trends.insights.length > 0) {
        console.log('\n💡 Insights:');
        trends.insights.forEach((insight: string) => {
          console.log(`  ${insight}`);
        });
      }
      break;
  }
}

/**
 * 输出详细的论文信息（包含增强元数据）
 */
function outputDetailedPaper(paper: Paper) {
  console.log('\n' + '='.repeat(100));
  console.log('📄 PAPER DETAILS');
  console.log('='.repeat(100));
  
  // 基本信息
  console.log(`\n📖 Title: ${paper.title}`);
  console.log(`👥 Authors: ${paper.authors.map((a: any) => a.name).join(', ')}`);
  console.log(`📅 Published: ${formatDate(paper.publishedDate)}`);
  console.log(`🔖 Source: ${paper.source}`);
  
  // 影响力指标
  if (paper.enhancedMetadata) {
    console.log(`\n⭐ Impact Score: ${paper.enhancedMetadata.impactScore?.toFixed(1) || 'N/A'}/100`);
    console.log(`📊 Influence Level: ${formatInfluenceLevel(paper.enhancedMetadata.influenceLevel)}`);
    if (paper.enhancedMetadata.isHighlyCited) {
      console.log(`🏆 Highly Cited Paper`);
    }
    if (paper.enhancedMetadata.isHotPaper) {
      console.log(`🔥 Hot Paper`);
    }
  }
  
  // 引用信息
  if (paper.citationCount !== undefined) {
    console.log(`\n📚 Citations: ${paper.citationCount}`);
    if (paper.enhancedMetadata?.citationVelocity) {
      console.log(`📈 Citation Velocity: ${paper.enhancedMetadata.citationVelocity.toFixed(2)} citations/month`);
    }
  }
  
  // 引用趋势
  if (paper.enhancedMetadata?.citationTrends) {
    const trends = paper.enhancedMetadata.citationTrends;
    console.log(`\n📊 Citation Trends:`);
    console.log(`   Average/year: ${trends.averageCitationsPerYear.toFixed(1)}`);
    if (trends.peakYear) {
      console.log(`   Peak: ${trends.peakCitations} citations in ${trends.peakYear}`);
    }
    if (trends.growthRate !== undefined) {
      console.log(`   Growth Rate: ${trends.growthRate.toFixed(1)}%`);
    }
  }
  
  // 全文可用性
  console.log(`\n📥 Full Text Availability:`);
  if (paper.enhancedMetadata?.fullTextDetails) {
    const details = paper.enhancedMetadata.fullTextDetails;
    console.log(`   Status: ${details.available ? '✅ Available' : '❌ Not Available'}`);
    if (details.accessType) {
      console.log(`   Access Type: ${formatAccessType(details.accessType)}`);
    }
    if (details.type) {
      console.log(`   Format: ${details.type.toUpperCase()}`);
    }
    if (details.url) {
      console.log(`   URL: ${details.url}`);
    }
    if (details.downloadable) {
      console.log(`   📥 Downloadable`);
    }
  } else {
    console.log(`   Status: ${paper.fullTextAvailable ? '✅ Available' : '❌ Not Available'}`);
  }
  
  // 学术标识符
  if (paper.enhancedMetadata?.identifiers) {
    const ids = paper.enhancedMetadata.identifiers;
    console.log(`\n🔑 Identifiers:`);
    if (ids.doi) console.log(`   DOI: ${ids.doi}`);
    if (ids.pmid) console.log(`   PMID: ${ids.pmid}`);
    if (ids.pmcid) console.log(`   PMCID: ${ids.pmcid}`);
    if (ids.arxivId) console.log(`   arXiv: ${ids.arxivId}`);
    if (ids.semanticScholarId) console.log(`   Semantic Scholar: ${ids.semanticScholarId}`);
  } else if (paper.doi) {
    console.log(`\n🔑 DOI: ${paper.doi}`);
  }
  
  // 数据质量
  if (paper.enhancedMetadata?.dataQuality) {
    const quality = paper.enhancedMetadata.dataQuality;
    console.log(`\n✨ Data Quality:`);
    console.log(`   Overall: ${quality.overall.toFixed(1)}%`);
    console.log(`   Completeness: ${quality.completeness.toFixed(1)}%`);
    console.log(`   Accuracy: ${quality.accuracy.toFixed(1)}%`);
    if (quality.missingFields.length > 0) {
      console.log(`   Missing Fields: ${quality.missingFields.slice(0, 3).join(', ')}${quality.missingFields.length > 3 ? '...' : ''}`);
    }
  }
  
  // 摘要
  if (paper.abstract) {
    console.log(`\n📝 Abstract:`);
    const abstractPreview = paper.abstract.length > 500 
      ? paper.abstract.substring(0, 500) + '...' 
      : paper.abstract;
    console.log(`   ${abstractPreview}`);
  }
  
  // 关键词
  if (paper.keywords && paper.keywords.length > 0) {
    console.log(`\n🏷️  Keywords: ${paper.keywords.slice(0, 10).join(', ')}`);
  }
  
  // 引用格式
  if (paper.citations) {
    console.log(`\n📋 Citation Formats:`);
    
    if (paper.citations.bibtex) {
      console.log(`\n   BibTeX:`);
      console.log(paper.citations.bibtex.split('\n').map(l => `   ${l}`).join('\n'));
    }
    
    if (paper.citations.apa) {
      console.log(`\n   APA:`);
      console.log(`   ${paper.citations.apa}`);
    }
    
    if (paper.citations.mla) {
      console.log(`\n   MLA:`);
      console.log(`   ${paper.citations.mla}`);
    }
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
}

/**
 * 输出增强的统计信息
 */
function outputEnhancedStats(stats: any) {
  if (!stats) return;
  
  console.log('\n' + '─'.repeat(120));
  console.log('📊 ENHANCED STATISTICS');
  console.log('─'.repeat(120));
  
  // 引用统计
  if (stats.citationStats) {
    console.log(`\n📚 Citation Statistics:`);
    console.log(`   Total Citations: ${stats.citationStats.totalCitations}`);
    console.log(`   Average Citations: ${stats.citationStats.averageCitations.toFixed(1)}`);
    console.log(`   Max Citations: ${stats.citationStats.maxCitations}`);
    
    if (stats.citationStats.citationDistribution) {
      console.log(`\n   Distribution:`);
      stats.citationStats.citationDistribution.forEach((dist: any) => {
        const bar = '█'.repeat(Math.floor(dist.percentage / 5));
        console.log(`   ${dist.range.padEnd(10)} ${bar} ${dist.count} (${dist.percentage.toFixed(1)}%)`);
      });
    }
  }
  
  // 影响力统计
  if (stats.impactStats) {
    console.log(`\n⭐ Impact Statistics:`);
    console.log(`   High Impact Papers: ${stats.impactStats.highImpactCount}`);
    console.log(`   Medium Impact Papers: ${stats.impactStats.mediumImpactCount}`);
    console.log(`   Low Impact Papers: ${stats.impactStats.lowImpactCount}`);
    console.log(`   Average Impact Score: ${stats.impactStats.averageImpactScore.toFixed(1)}/100`);
  }
  
  // 时间统计
  if (stats.timeStats) {
    console.log(`\n📅 Time Statistics:`);
    console.log(`   Oldest Paper: ${formatDate(stats.timeStats.oldestPaper)}`);
    console.log(`   Newest Paper: ${formatDate(stats.timeStats.newestPaper)}`);
    console.log(`   Publication Years: ${stats.timeStats.publicationYears.join(', ')}`);
  }
  
  // 平台统计
  if (stats.platformStats) {
    console.log(`\n🔖 Platform Statistics:`);
    const platforms = Object.entries(stats.platformStats);
    platforms.forEach(([source, data]: [string, any]) => {
      console.log(`   ${source.padEnd(20)} Papers: ${data.count.toString().padEnd(5)} Avg Citations: ${data.averageCitations.toFixed(1).padEnd(6)} Full Text: ${data.fullTextAvailable}`);
    });
  }
  
  console.log('─'.repeat(120) + '\n');
}

function outputTable(papers: any[]) {
  if (!papers || papers.length === 0) {
    console.log('\n📚 No results found.');
    return;
  }

  console.log('\n📚 Search Results:');
  console.log('─'.repeat(120));
  console.log(
    'Title'.padEnd(40) + 
    'Authors'.padEnd(25) + 
    'Source'.padEnd(15) + 
    'Published'.padEnd(12) + 
    'Citations'
  );
  console.log('─'.repeat(120));
  
  papers.forEach(paper => {
    const title = truncateString(paper.title || 'Untitled', 38);
    const authors = paper.authors && paper.authors.length > 0
      ? truncateString(paper.authors.slice(0, 2).map((a: any) => a.name).join(', '), 23)
      : 'Unknown';
    const source = truncateString(paper.source || 'N/A', 13);
    const publishedDate = formatDate(paper.publishedDate);
    const citations = (paper.citationCount || 0).toString().padEnd(9);
    
    // 添加影响力指标
    let indicator = '';
    if (paper.enhancedMetadata?.isHighlyCited) indicator = '🏆';
    else if (paper.enhancedMetadata?.isHotPaper) indicator = '🔥';
    else if (paper.enhancedMetadata?.influenceLevel === 'very_high') indicator = '⭐';
    
    console.log(
      (indicator + ' ' + title).padEnd(40) +
      authors.padEnd(25) +
      source.padEnd(15) +
      publishedDate.padEnd(12) +
      citations
    );
  });
  
  console.log('─'.repeat(120));
  console.log(`Total: ${papers.length} papers`);
}

function outputCSV(papers: any[]) {
  if (!papers || papers.length === 0) {
    console.log('No results to export.');
    return;
  }

  console.log('Title,Authors,Source,Published,DOI,Citations,Impact Score,Full Text Available,Access Type,Abstract');
  papers.forEach(paper => {
    const title = escapeCSV(paper.title || '');
    const authors = escapeCSV(
      paper.authors && paper.authors.length > 0
        ? paper.authors.map((a: any) => a.name).join(';')
        : ''
    );
    const source = escapeCSV(paper.source || '');
    const publishedDate = formatDate(paper.publishedDate);
    const doi = escapeCSV(paper.doi || '');
    const citations = paper.citationCount || 0;
    const impactScore = paper.enhancedMetadata?.impactScore?.toFixed(1) || '';
    const fullTextAvailable = paper.fullTextAvailable ? 'Yes' : 'No';
    const accessType = paper.enhancedMetadata?.fullTextDetails?.accessType || '';
    const abstract = escapeCSV((paper.abstract || '').substring(0, 500));
    
    console.log(
      `"${title}","${authors}","${source}","${publishedDate}","${doi}",${citations},"${impactScore}","${fullTextAvailable}","${accessType}","${abstract}"`
    );
  });
}

function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 2) + '..';
}

function escapeCSV(str: string): string {
  if (!str) return '';
  return str.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return date.substring(0, 10);
  }
  
  return 'N/A';
}

function formatInfluenceLevel(level: string | undefined): string {
  if (!level) return 'N/A';
  
  const levelMap: Record<string, string> = {
    'very_high': '⭐⭐⭐⭐ Very High',
    'high': '⭐⭐⭐ High',
    'medium': '⭐⭐ Medium',
    'low': '⭐ Low'
  };
  
  return levelMap[level] || level;
}

function formatAccessType(type: AccessType): string {
  const typeMap: Record<AccessType, string> = {
    [AccessType.OPEN_ACCESS]: '🔓 Open Access',
    [AccessType.FREE]: '🆓 Free',
    [AccessType.SUBSCRIPTION]: '🔒 Subscription',
    [AccessType.HYBRID]: '🔀 Hybrid',
    [AccessType.CLOSED]: '❌ Closed'
  };
  
  return typeMap[type] || type;
}