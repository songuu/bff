import { cacheService } from './cache.js';

/**
 * 规则决策引擎
 * 根据 enterprise_id 查询匹配的 version_tag
 */
class RuleEngine {
  constructor() {
    // 默认规则映射（可以从配置文件或数据库加载）
    this.defaultRules = {
      'enterprise-a': '2.0.0-beta',
      'enterprise-b': '1.8.0-stable',
      'default': '1.8.0-stable',
    };
  }

  /**
   * 根据 enterprise_id 获取 version_tag
   * @param {string} enterpriseId - 企业 ID
   * @returns {Promise<string>}
   */
  async getVersionTag(enterpriseId) {
    // 1. 优先从缓存中获取
    let versionTag = await cacheService.getVersionTag(enterpriseId);

    // 2. 如果缓存中没有，使用默认规则
    if (!versionTag) {
      versionTag = this.defaultRules[enterpriseId] || this.defaultRules['default'];
      
      // 将规则写入缓存（可选）
      await cacheService.setVersionTag(enterpriseId, versionTag, 3600);
    }

    return versionTag;
  }

  /**
   * 设置企业版本规则
   * @param {string} enterpriseId - 企业 ID
   * @param {string} versionTag - 版本标签
   * @param {number} ttl - 缓存过期时间（秒）
   * @returns {Promise<boolean>}
   */
  async setVersionRule(enterpriseId, versionTag, ttl = 3600) {
    // 更新默认规则
    this.defaultRules[enterpriseId] = versionTag;
    
    // 更新缓存
    return await cacheService.setVersionTag(enterpriseId, versionTag, ttl);
  }

  /**
   * 批量设置规则
   * @param {Object} rules - 规则对象 { enterpriseId: versionTag }
   * @returns {Promise<void>}
   */
  async setRules(rules) {
    const promises = Object.entries(rules).map(([enterpriseId, versionTag]) =>
      this.setVersionRule(enterpriseId, versionTag)
    );
    await Promise.all(promises);
  }

  /**
   * 获取所有规则
   * @returns {Object}
   */
  getDefaultRules() {
    return { ...this.defaultRules };
  }
}

// 导出单例
export const ruleEngine = new RuleEngine();

