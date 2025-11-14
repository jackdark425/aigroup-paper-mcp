import { DriverConfig } from './driver.js';

export interface AppConfig {
  server: ServerConfig;
  drivers: DriversConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  searchStrategy?: SearchStrategyConfig;
}

export interface ServerConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

export interface DriversConfig {
  [key: string]: DriverConfig;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  storage?: StorageConfig;
}

export interface StorageConfig {
  type: 'json-file' | 'memory';
  path?: string;
  namespace?: string;
  defaultTtl?: number;
  maxSize?: number;
  compress?: boolean;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'simple';
  destination: 'console' | 'file' | 'both';
  filePath?: string;
}

export interface SearchStrategyConfig {
  prioritizeOpenAccess?: boolean;
  maxParallelRequests?: number;
  enableIncrementalResults?: boolean;
  preferredResponseTime?: number;
  minSuccessRate?: number;
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
}