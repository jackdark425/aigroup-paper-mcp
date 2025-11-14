#!/usr/bin/env node

import { MCPServer } from './services/mcp-server.js';
import { logger } from './core/logger.js';

async function main() {
  try {
    logger.info('Starting AIGROUP Paper MCP Server...');
    const server = new MCPServer();
    await server.start();
    
    logger.info('AIGROUP Paper MCP Server is running');
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

main();