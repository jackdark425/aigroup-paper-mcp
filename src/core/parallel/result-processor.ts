/**
 * 结果处理模块
 */

import { Paper } from '../../types/paper.js';
import { Logger } from '../logger.js';
import { SearchResultWrapper } from './execution-strategies.js';
import { ParallelSearchMetrics, PlatformMetrics } from './types.js';

const logger = new Logger('ResultProcessor');

export class ResultProcessor {
  /**
   * 合并和去重搜索结果
   */
  static mergeAndDeduplicateResults(
    results: SearchResultWrapper[],
    enableDeduplication: boolean = true
  ): {
    papers: Paper[];
    totalBySource: Record<string, number>;
    duplicateCount: number;
  } {
    const allPapers: Paper[] = [];
    const totalBySource: Record<string, number> = {};

    for (const wrapper of results) {
      if (wrapper.result) {
        allPapers.push(...wrapper.result.papers);
        totalBySource[wrapper.source] = wrapper.result.total;
      }
    }

    if (!enableDeduplication) {
      return {
        papers: allPapers,
        totalBySource,
        duplicateCount: 0
      };
    }

    const uniquePapers = this.deduplicatePapers(allPapers);
    const duplicateCount = allPapers.length - uniquePapers.length;

    logger.info(`结果去重: ${allPapers.length} -> ${uniquePapers.length} (移除 ${duplicateCount} 个重复)`);

    return {
      papers: uniquePapers,
      totalBySource,
      duplicateCount
    };
  }

  /**
   * 论文去重
   */
  private static deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Map<string, Paper>();
    
    for (const paper of papers) {
      if (paper.doi) {
        const key = paper.doi.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.set(key, paper);
        } else {
          const existing = seen.get(key)!;
          if (this.isMoreComplete(paper, existing)) {
            seen.set(key, paper);
          }
        }
        continue;
      }
      
      const titleKey = this.createTitleKey(paper.title);
      const authorKey = paper.authors.length > 0 
        ? paper.authors[0].name.toLowerCase().trim() 
        : '';
      const key = `${titleKey}|${authorKey}`;
      
      if (!seen.has(key)) {
        seen.set(key, paper);
      } else {
        const existing = seen.get(key)!;
        if (this.isMoreComplete(paper, existing)) {
          seen.set(key, paper);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * 创建标题键（用于去重）
   */
  private static createTitleKey(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * 判断论文A是否比论文B更完整
   */
  private static isMoreComplete(paperA: Paper, paperB: Paper): boolean {
    let scoreA = 0;
    let scoreB = 0;
    
    if (paperA.doi) scoreA += 10;
    if (paperB.doi) scoreB += 10;
    
    if (paperA.abstract) scoreA += 5;
    if (paperB.abstract) scoreB += 5;
    
    if (paperA.citationCount) scoreA += 3;
    if (paperB.citationCount) scoreB += 3;
    
    if (paperA.fullTextAvailable) scoreA += 2;
    if (paperB.fullTextAvailable) scoreB += 2;
    
    scoreA += paperA.authors.length;
    scoreB += paperB.authors.length;
    
    if (paperA.keywords) scoreA += paperA.keywords.length * 0.5;
    if (paperB.keywords) scoreB += paperB.keywords.length * 0.5;
    
    return scoreA > scoreB;
  }

  /**
   * 计算性能指标
   */
  static calculateMetrics(
    results: SearchResultWrapper[],
    startTime: number,
    totalPlatforms: number
  ): ParallelSearchMetrics {
    const totalDuration = Date.now() - startTime;
    const successfulResults = results.filter(r => r.result !== undefined);
    const failedResults = results.filter(r => r.error !== undefined);
    
    const latencies = results
      .filter(r => r.latency > 0)
      .map(r => r.latency);
    
    const platformMetrics: PlatformMetrics[] = results.map(r => ({
      source: r.source as any,
      success: r.result !== undefined,
      latency: r.latency,
      paperCount: r.result?.papers.length || 0,
      error: r.error?.message
    }));

    const allPapers = successfulResults.flatMap(r => r.result!.papers);
    const uniquePapers = this.deduplicatePapers(allPapers);

    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const theoreticalSequentialTime = latencies.reduce((a, b) => a + b, 0);
    const parallelEfficiency = theoreticalSequentialTime > 0 
      ? theoreticalSequentialTime / totalDuration 
      : 1;

    return {
      totalDuration,
      platformCount: totalPlatforms,
      successfulPlatforms: successfulResults.length,
      failedPlatforms: failedResults.length,
      averageLatency: avgLatency,
      maxLatency,
      minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
      totalPapers: allPapers.length,
      uniquePapers: uniquePapers.length,
      duplicatePapers: allPapers.length - uniquePapers.length,
      platformMetrics,
      parallelEfficiency
    };
  }
}