/**
 * 存储接口定义
 */
export interface StorageInterface {
  /**
   * 存储数据
   * @param key 存储键
   * @param data 存储数据
   * @param ttl 过期时间（秒）
   */
  set<T>(key: string, data: T, ttl?: number): Promise<void>;

  /**
   * 获取数据
   * @param key 存储键
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 删除数据
   * @param key 存储键
   */
  delete(key: string): Promise<void>;

  /**
   * 检查键是否存在
   * @param key 存储键
   */
  has(key: string): Promise<boolean>;

  /**
   * 清空所有数据
   */
  clear(): Promise<void>;

  /**
   * 获取所有键
   */
  keys(): Promise<string[]>;

  /**
   * 获取存储大小
   */
  size(): Promise<number>;
}

/**
 * 缓存项接口
 */
export interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * 存储配置
 */
export interface StorageConfig {
  /**
   * 存储路径（文件存储使用）
   */
  path?: string;

  /**
   * 默认TTL（秒）
   */
  defaultTtl?: number;

  /**
   * 最大存储大小（字节）
   */
  maxSize?: number;

  /**
   * 是否启用压缩
   */
  compress?: boolean;
}