import NodeCache from 'node-cache';
import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * 缓存服务
 * 支持内存缓存和 Redis 缓存
 */
class CacheService {
  constructor() {
    this.memoryCache = null;
    this.redisClient = null;
    this.useRedis = config.cache.useRedis;

    if (this.useRedis) {
      this.initRedis();
    } else {
      this.initMemoryCache();
    }
  }

  initMemoryCache() {
    this.memoryCache = new NodeCache({
      stdTTL: config.cache.memory.stdTTL,
      checkperiod: config.cache.memory.checkperiod,
      useClones: false,
    });
    console.log('✅ 内存缓存已初始化');
  }

  initRedis() {
    this.redisClient = new Redis({
      host: config.cache.redis.host,
      port: config.cache.redis.port,
      password: config.cache.redis.password,
      db: config.cache.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redisClient.on('connect', () => {
      console.log('✅ Redis 连接已建立');
    });

    this.redisClient.on('error', (err) => {
      console.error('❌ Redis 连接错误:', err);
      // 降级到内存缓存
      if (!this.memoryCache) {
        this.initMemoryCache();
        this.useRedis = false;
      }
    });
  }

  /**
   * 获取缓存值
   * @param {string} key - 缓存键
   * @returns {Promise<string|null>}
   */
  async get(key) {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value;
      } else if (this.memoryCache) {
        return this.memoryCache.get(key) || null;
      }
      return null;
    } catch (error) {
      console.error('缓存获取错误:', error);
      return null;
    }
  }

  /**
   * 设置缓存值
   * @param {string} key - 缓存键
   * @param {string} value - 缓存值
   * @param {number} ttl - 过期时间（秒），可选
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = null) {
    try {
      if (this.useRedis && this.redisClient) {
        if (ttl) {
          await this.redisClient.setex(key, ttl, value);
        } else {
          await this.redisClient.set(key, value);
        }
        return true;
      } else if (this.memoryCache) {
        if (ttl) {
          this.memoryCache.set(key, value, ttl);
        } else {
          this.memoryCache.set(key, value);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('缓存设置错误:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
        return true;
      } else if (this.memoryCache) {
        this.memoryCache.del(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error('缓存删除错误:', error);
      return false;
    }
  }

  /**
   * 根据 enterprise_id 获取 version_tag
   * @param {string} enterpriseId - 企业 ID
   * @returns {Promise<string|null>}
   */
  async getVersionTag(enterpriseId) {
    const key = `enterprise:${enterpriseId}:version_tag`;
    return await this.get(key);
  }

  /**
   * 设置 enterprise_id 到 version_tag 的映射
   * @param {string} enterpriseId - 企业 ID
   * @param {string} versionTag - 版本标签
   * @param {number} ttl - 过期时间（秒），可选
   * @returns {Promise<boolean>}
   */
  async setVersionTag(enterpriseId, versionTag, ttl = null) {
    const key = `enterprise:${enterpriseId}:version_tag`;
    return await this.set(key, versionTag, ttl);
  }
}

// 导出单例
export const cacheService = new CacheService();

