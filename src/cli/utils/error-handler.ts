import { logger } from '../../core/logger.js';

/**
 * 统一的错误处理函数
 */
export function handleError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`${context} failed: ${errorMessage}`, { 
    error: errorMessage, 
    stack: errorStack 
  });
  
  console.error(`\n❌ Error: ${errorMessage}`);
  process.exit(1);
}