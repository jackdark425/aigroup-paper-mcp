import { config as dotenvConfig } from 'dotenv';
import { AppConfig } from '../types/config.js';
import { defaultConfig } from './defaults.js';
import { AppConfigSchema } from './schemas.js';

dotenvConfig();

export function loadConfig(): AppConfig {
  const config: AppConfig = { ...defaultConfig };
  
  // 从环境变量加载配置
  if (process.env.NODE_ENV) {
    config.server.environment = process.env.NODE_ENV as any;
  }
  
  if (process.env.LOG_LEVEL) {
    config.logging.level = process.env.LOG_LEVEL as any;
  }
  
  if (process.env.CACHE_TTL) {
    config.cache.ttl = parseInt(process.env.CACHE_TTL, 10);
  }
  
  if (process.env.MAX_CACHE_SIZE) {
    config.cache.maxSize = parseInt(process.env.MAX_CACHE_SIZE, 10);
  }
  
  // 验证配置
  const validated = AppConfigSchema.parse(config);
  
  return validated;
}

export const config = loadConfig();