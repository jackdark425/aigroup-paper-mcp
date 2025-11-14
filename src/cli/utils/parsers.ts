import { PlatformSource } from '../../types/paper.js';

/**
 * 解析数字参数，提供默认值和最小值验证
 */
export function parseNumber(value: string, defaultValue: number, minValue?: number): number {
  const num = parseInt(value) || defaultValue;
  return minValue !== undefined ? Math.max(minValue, num) : num;
}

/**
 * 解析平台源列表，提供默认值
 */
export function parseSources(sources: string[] | undefined): PlatformSource[] {
  return (sources || []) as PlatformSource[];
}