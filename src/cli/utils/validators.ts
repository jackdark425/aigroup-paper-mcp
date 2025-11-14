/**
 * 命令选项验证工具
 */

export function validateOptions(options: any): void {
  const errors: string[] = [];

  if (options.limit && isNaN(parseInt(options.limit))) {
    errors.push('--limit must be a valid number');
  }

  if (options.offset && isNaN(parseInt(options.offset))) {
    errors.push('--offset must be a valid number');
  }

  if (options.cacheTtl && isNaN(parseInt(options.cacheTtl))) {
    errors.push('--cache-ttl must be a valid number');
  }

  if (options.maxResponseSize && isNaN(parseInt(options.maxResponseSize))) {
    errors.push('--max-response-size must be a valid number');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid options:\n  ${errors.join('\n  ')}`);
  }
}