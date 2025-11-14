/**
 * 日期和时间处理工具
 */

/**
 * 计算时间范围
 */
export function calculateDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  let start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start = new Date('2010-01-01'); // 限制起始日期避免过多数据
      break;
    default:
      start.setFullYear(end.getFullYear() - 1);
  }
  
  return { start, end };
}

/**
 * 生成时间区间
 */
export function generateTimeIntervals(start: Date, end: Date, granularity: string): string[] {
  const intervals: string[] = [];
  const current = new Date(start);
  
  // 限制最大区间数量
  const maxIntervals = granularity === 'day' ? 30 : granularity === 'week' ? 12 : 12;
  
  while (current <= end && intervals.length < maxIntervals) {
    let interval: string;
    
    switch (granularity) {
      case 'day':
        interval = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        interval = `${current.getFullYear()}-W${Math.ceil((current.getDate() + current.getDay()) / 7)}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
      default:
        interval = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
        break;
    }
    
    intervals.push(interval);
  }
  
  return intervals;
}