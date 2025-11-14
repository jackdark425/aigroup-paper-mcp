import winston from 'winston';
import { config } from '../config/index.js';

const formats = {
  simple: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
};

const transports: winston.transport[] = [];

if (config.logging.destination === 'console' || config.logging.destination === 'both') {
  transports.push(new winston.transports.Console());
}

if (config.logging.destination === 'file' || config.logging.destination === 'both') {
  if (config.logging.filePath) {
    transports.push(new winston.transports.File({ filename: config.logging.filePath }));
  }
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: formats[config.logging.format],
  transports
});

export class Logger {
  constructor(private context: string) {}
  
  error(message: string, ...args: any[]): void {
    logger.error(`[${this.context}] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    logger.warn(`[${this.context}] ${message}`, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    logger.info(`[${this.context}] ${message}`, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    logger.debug(`[${this.context}] ${message}`, ...args);
  }
}