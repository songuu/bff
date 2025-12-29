import express from 'express';
import { ruleEngine } from '../services/ruleEngine.js';
import { storageService } from '../services/storage.js';
import { htmlInjector } from '../services/htmlInjector.js';

/**
 * 业务路由（面向前端业务 / C 端流量）
 * - 首页渲染
 * - 企业配置查询
 * - BFF 侧灰度版本匹配（/api/bff/route/match）
 */
const businessRouter = express.Router();

/**
 * BFF: 根据 enterprise_id 返回对应的灰度 version
 *
 * 接口路径:  /api/bff/route/match
 * 方法:      POST
 * 入参:
 *   {
 *     "enterprise_id": "enterprise-a",
 *     "path": "/api/v1/user/info" // 目前预留，暂未参与决策
 *   }
 * 返回:
 *   {
 *     "version": "1.0.0"
 *   }
 */
businessRouter.post('/api/bff/route/match', async (req, res) => {
  const { enterprise_id, path } = req.body || {};

  if (!enterprise_id) {
    return res.status(400).json({
      error: 'enterprise_id 不能为空',
    });
  }

  // 目前只按 enterprise_id 做灰度，将来可以把 path 也纳入规则维度
  const version = await ruleEngine.getVersionTag(enterprise_id);

  res.json({
    enterprise_id,
    path: path || null,
    version,
  });
});

/**
 * 首页路由
 * 1. 获取 enterprise_id（已通过中间件处理）
 * 2. 查询 version_tag
 * 3. 读取对应版本的 index.html
 * 4. 注入企业配置
 * 5. 返回 HTML
 */
businessRouter.get('/', async (req, res, next) => {
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
 * - 给前端 JS 使用，拿到统一的业务配置
 */
businessRouter.get('/api/config', (req, res) => {
  const enterpriseId = req.enterprise_id || 'default';
  const config = htmlInjector.generateDefaultConfig(enterpriseId);

  res.json({
    enterprise_id: enterpriseId,
    ...config,
  });
});

export default businessRouter;


