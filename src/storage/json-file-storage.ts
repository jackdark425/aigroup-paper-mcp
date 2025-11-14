import { promises as fs } from 'fs';
import { dirname } from 'path';
import { StorageInterface, StorageConfig, CacheItem } from './storage-interface.js';
import { Logger } from '../core/logger.js';

/**
 * JSON文件存储实现
 */
export class JsonFileStorage implements StorageInterface {
  private readonly logger: Logger;
  private readonly filePath: string;
  private readonly defaultTtl: number;
  private readonly maxSize: number;
  private data: Map<string, CacheItem<any>> = new Map();

  constructor(config: StorageConfig = {}) {
    this.logger = new Logger('JsonFileStorage');
    this.filePath = config.path || './cache/data.json';
    this.defaultTtl = config.defaultTtl || 3600; // 1小时
    this.maxSize = config.maxSize || 100 * 1024 * 1024; // 100MB

    this.initialize();
  }

  /**
   * 初始化存储
   */
  private async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      await this.loadFromFile();
      await this.cleanupExpired();
    } catch (error) {
      this.logger.warn('Failed to initialize storage, starting with empty cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(): Promise<void> {
    const dir = dirname(this.filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * 从文件加载数据
   */
  private async loadFromFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (this.isValidCacheItem(value)) {
            this.data.set(key, value);
          }
        });
      }
      
      this.logger.info(`Loaded ${this.data.size} items from cache file`);
    } catch (error) {
      // 文件不存在或格式错误，使用空缓存
      this.data.clear();
    }
  }

  /**
   * 保存数据到文件
   */
  private async saveToFile(): Promise<void> {
    try {
      const data: Record<string, CacheItem<any>> = {};
      this.data.forEach((value, key) => {
        data[key] = value;
      });
      
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error('Failed to save cache to file', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 检查是否为有效的缓存项
   */
  private isValidCacheItem(item: any): item is CacheItem<any> {
    return (
      typeof item === 'object' &&
      item !== null &&
      'data' in item &&
      'expiresAt' in item &&
      'createdAt' in item &&
      typeof item.expiresAt === 'number' &&
      typeof item.createdAt === 'number'
    );
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.data.entries()) {
      if (item.expiresAt <= now) {
        this.data.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.info(`Cleaned up ${expiredCount} expired items`);
      await this.saveToFile();
    }
  }

  /**
   * 检查存储大小
   */
  private async checkSize(): Promise<void> {
    const currentSize = await this.size();
    if (currentSize > this.maxSize) {
      // 简单的LRU策略：删除最旧的项目
      const entries = Array.from(this.data.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const itemsToRemove = Math.ceil(entries.length * 0.1); // 删除10%的最旧项目
      for (let i = 0; i < itemsToRemove; i++) {
        this.data.delete(entries[i][0]);
      }
      
      this.logger.info(`Cleared ${itemsToRemove} items due to size limit`);
      await this.saveToFile();
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTtl) * 1000;
    
    const cacheItem: CacheItem<T> = {
      data,
      expiresAt,
      createdAt: now
    };

    this.data.set(key, cacheItem);
    await this.saveToFile();
    await this.checkSize();
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    
    if (!item) {
      return null;
    }

    if (item.expiresAt <= Date.now()) {
      // 过期数据，删除并返回null
      await this.delete(key);
      return null;
    }

    return item.data;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
    await this.saveToFile();
  }

  async has(key: string): Promise<boolean> {
    const item = this.data.get(key);
    if (!item) {
      return false;
    }

    if (item.expiresAt <= Date.now()) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.data.clear();
    await this.saveToFile();
  }

  async keys(): Promise<string[]> {
    await this.cleanupExpired();
    return Array.from(this.data.keys());
  }

  async size(): Promise<number> {
    const data = JSON.stringify(Object.fromEntries(this.data));
    return Buffer.byteLength(data, 'utf8');
  }
}