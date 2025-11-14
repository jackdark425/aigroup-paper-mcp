/**
 * 关键词提取工具
 */

/**
 * 从论文中提取关键词
 */
export function extractKeywords(papers: any[]): string[] {
  const keywordCounts: Record<string, number> = {};
  
  papers.forEach(paper => {
    if (paper.keywords && Array.isArray(paper.keywords)) {
      paper.keywords.forEach((keyword: string) => {
        const normalized = keyword.toLowerCase().trim();
        if (normalized.length > 2) { // 忽略太短的词
          keywordCounts[normalized] = (keywordCounts[normalized] || 0) + 1;
        }
      });
    }
    
    // 从标题和摘要中提取关键词（简单实现）
    const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 3);
    
    words.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });
  });
  
  // 返回前10个最常见的关键词
  return Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword]) => keyword);
}