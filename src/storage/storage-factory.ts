import { StorageInterface, StorageConfig } from './storage-interface.js';
import { JsonFileStorage } from './json-file-storage.js';
import { Logger } from '../core/logger.js';

/**
 * 存储类型
 */
export enum StorageType {
  JSON_FILE = 'json-file',
  MEMORY = 'memory',
  // 可以添加更多存储类型，如数据库、Redis等
}

/**
 * 存储工厂
 */
export class StorageFactory {
  private static readonly logger = new Logger('StorageFactory');
  private static instances: Map<string, StorageInterface> = new Map();

  /**
   * 创建存储实例
   * @param type 存储类型
   * @param config 存储配置
   * @param namespace 命名空间（用于区分不同用途的存储）
   */
  static create(
    type: StorageType = StorageType.JSON_FILE,
    config: StorageConfig = {},
    namespace: string = 'default'
  ): StorageInterface {
    const key = `${type}:${namespace}`;
    
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let storage: StorageInterface;

    switch (type) {
      case StorageType.JSON_FILE:
        storage = new JsonFileStorage(config);
        break;
      case StorageType.MEMORY:
        // 内存存储实现（简单版本）
        storage = new MemoryStorage(config);
        break;
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }

    this.instances.set(key, storage);
    this.logger.info(`Created storage instance: ${key}`);
    
    return storage;
  }

  /**
   * 获取存储实例
   * @param type 存储类型
   * @param namespace 命名空间
   */
  static get(
    type: StorageType = StorageType.JSON_FILE,
    namespace: string = 'default'
  ): StorageInterface | undefined {
    const key = `${type}:${namespace}`;
    return this.instances.get(key);
  }

  /**
   * 销毁存储实例
   * @param type 存储类型
   * @param namespace 命名空间
   */
  static destroy(
    type: StorageType = StorageType.JSON_FILE,
    namespace: string = 'default'
  ): void {
    const key = `${type}:${namespace}`;
    const instance = this.instances.get(key);
    
    if (instance) {
      // 如果有清理操作，可以在这里执行
      this.instances.delete(key);
      this.logger.info(`Destroyed storage instance: ${key}`);
    }
  }
}

/**
 * 简单的内存存储实现
 */
class MemoryStorage implements StorageInterface {
  private data: Map<string, any> = new Map();
  private readonly defaultTtl: number;

  constructor(config: StorageConfig = {}) {
    this.defaultTtl = config.defaultTtl || 3600;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.defaultTtl) * 1000;
    this.data.set(key, {
      data,
      expiresAt
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    
    if (!item) {
      return null;
    }

    if (item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return null;
    }

    return item.data;
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const item = this.data.get(key);
    
    if (!item) {
      return false;
    }

    if (item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    const now = Date.now();
    const validKeys: string[] = [];
    
    for (const [key, item] of this.data.entries()) {
      if (item.expiresAt > now) {
        validKeys.push(key);
      } else {
        this.data.delete(key);
      }
    }
    
    return validKeys;
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}