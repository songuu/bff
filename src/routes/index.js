import express from 'express';
import { ruleEngine } from '../services/ruleEngine.js';
import { storageService } from '../services/storage.js';
import { htmlInjector } from '../services/htmlInjector.js';

const router = express.Router();

/**
 * 首页路由
 * 1. 获取 enterprise_id（已通过中间件处理）
 * 2. 查询 version_tag
 * 3. 读取对应版本的 index.html
 * 4. 注入企业配置
 * 5. 返回 HTML
 */
router.get('/', async (req, res, next) => {
  try {
    const enterpriseId = req.enterprise_id || 'default';

    // 1. 规则决策：获取 version_tag
    const versionTag = await ruleEngine.getVersionTag(enterpriseId);
    console.log(`[${enterpriseId}] -> version_tag: ${versionTag}`);

    // 2. 资源读取：从存储中读取 index.html
    let html;
    try {
      html = await storageService.readIndexHtml(versionTag);
    } catch (error) {
      // 如果读取失败，返回错误页面
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>资源未找到</title>
        </head>
        <body>
          <h1>资源未找到</h1>
          <p>版本 ${versionTag} 的资源文件不存在</p>
          <p>企业 ID: ${enterpriseId}</p>
        </body>
        </html>
      `);
    }

    // 3. 动态注入：注入企业配置
    const enterpriseConfig = htmlInjector.generateDefaultConfig(enterpriseId);
    html = htmlInjector.injectConfig(html, enterpriseId, enterpriseConfig);

    // 4. 响应返回
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('首页路由错误:', error);
    next(error);
  }
});

/**
 * API: 获取当前企业的配置信息
 */
router.get('/api/config', (req, res) => {
  const enterpriseId = req.enterprise_id || 'default';
  const config = htmlInjector.generateDefaultConfig(enterpriseId);
  res.json({
    enterprise_id: enterpriseId,
    ...config,
  });
});

/**
 * API: 设置企业版本规则（管理接口）
 */
router.post('/api/rules', async (req, res) => {
  try {
    const { enterprise_id, version_tag, ttl } = req.body;
    
    if (!enterprise_id || !version_tag) {
      return res.status(400).json({
        error: '缺少必要参数: enterprise_id, version_tag',
      });
    }

    await ruleEngine.setVersionRule(enterprise_id, version_tag, ttl);
    
    res.json({
      success: true,
      message: '规则已更新',
      rule: {
        enterprise_id,
        version_tag,
      },
    });
  } catch (error) {
    console.error('设置规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: 获取所有规则
 */
router.get('/api/rules', (req, res) => {
  const rules = ruleEngine.getDefaultRules();
  res.json({ rules });
});

export default router;

