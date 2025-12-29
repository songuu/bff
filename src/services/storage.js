import OSS from 'ali-oss';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/index.js';

/**
 * 存储服务
 * 支持 OSS 和本地磁盘存储
 */
class StorageService {
  constructor() {
    this.useOSS = config.storage.useOSS;
    this.ossClient = null;
    this.localBasePath = config.storage.local.basePath;

    if (this.useOSS) {
      this.initOSS();
    } else {
      console.log(`✅ 使用本地存储，基础路径: ${this.localBasePath}`);
    }
  }

  initOSS() {
    try {
      this.ossClient = new OSS({
        region: config.storage.oss.region,
        accessKeyId: config.storage.oss.accessKeyId,
        accessKeySecret: config.storage.oss.accessKeySecret,
        bucket: config.storage.oss.bucket,
      });
      console.log('✅ OSS 客户端已初始化');
    } catch (error) {
      console.error('❌ OSS 初始化失败:', error);
      console.log('降级到本地存储');
      this.useOSS = false;
    }
  }

  /**
   * 读取文件内容
   * @param {string} filePath - 文件路径（相对于版本目录）
   * @param {string} versionTag - 版本标签
   * @returns {Promise<string>}
   */
  async readFile(filePath, versionTag) {
    try {
      if (this.useOSS && this.ossClient) {
        // OSS 路径格式: {versionTag}/{filePath}
        const ossPath = `${versionTag}/${filePath}`;
        const result = await this.ossClient.get(ossPath);
        return result.content.toString('utf-8');
      } else {
        // 本地路径格式: {localBasePath}/{versionTag}/{filePath}
        const localPath = join(this.localBasePath, versionTag, filePath);
        const content = await readFile(localPath, 'utf-8');
        return content;
      }
    } catch (error) {
      console.error(`读取文件失败 [${filePath}, ${versionTag}]:`, error.message);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath - 文件路径
   * @param {string} versionTag - 版本标签
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath, versionTag) {
    try {
      if (this.useOSS && this.ossClient) {
        const ossPath = `${versionTag}/${filePath}`;
        await this.ossClient.head(ossPath);
        return true;
      } else {
        const localPath = join(this.localBasePath, versionTag, filePath);
        await access(localPath);
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 读取 index.html
   * @param {string} versionTag - 版本标签
   * @returns {Promise<string>}
   */
  async readIndexHtml(versionTag) {
    return await this.readFile('index.html', versionTag);
  }
}

// 导出单例
export const storageService = new StorageService();

