import { TrendDataPoint } from '../trend-analysis.js';

/**
 * 趋势洞察生成器
 */

/**
 * 生成趋势洞察
 */
export function generateInsights(dataPoints: TrendDataPoint[], topic: string): string[] {
  const insights: string[] = [];
  
  if (dataPoints.length < 2) {
    insights.push('数据点不足，无法生成有意义的趋势分析');
    return insights;
  }
  
  // 计算总体趋势
  const firstCount = dataPoints[0].count;
  const lastCount = dataPoints[dataPoints.length - 1].count;
  const overallGrowth = ((lastCount - firstCount) / firstCount) * 100;
  
  if (overallGrowth > 20) {
    insights.push(`📈 强劲增长: 关于"${topic}"的论文数量增长了 ${overallGrowth.toFixed(1)}%`);
  } else if (overallGrowth > 0) {
    insights.push(`📊 稳定增长: 关于"${topic}"的论文数量增长了 ${overallGrowth.toFixed(1)}%`);
  } else if (overallGrowth < -10) {
    insights.push(`📉 下降趋势: 关于"${topic}"的论文数量下降了 ${Math.abs(overallGrowth).toFixed(1)}%`);
  } else {
    insights.push(`📋 稳定状态: 关于"${topic}"的论文数量保持相对稳定`);
  }
  
  // 找到高峰期
  const peakPoint = dataPoints.reduce((max, point) => 
    point.count > max.count ? point : max, dataPoints[0]);
  
  if (peakPoint.count > dataPoints[dataPoints.length - 1].count * 1.5) {
    insights.push(`🏆 研究高峰期: ${peakPoint.period} (${peakPoint.count}篇论文)`);
  }
  
  // 分析关键词趋势
  const recentKeywords = dataPoints[dataPoints.length - 1].topKeywords || [];
  if (recentKeywords.length > 0) {
    insights.push(`🔑 近期热门关键词: ${recentKeywords.slice(0, 3).join(', ')}`);
  }
  
  return insights;
}