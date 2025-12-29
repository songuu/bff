import express from 'express';
import { ruleEngine } from '../services/ruleEngine.js';

/**
 * 管理路由（面向运营 / 管理后台）
 * - 规则管理（设置 / 查询 enterprise_id -> version_tag）
 * - 后续可以扩展更多管理类接口
 */
const adminRouter = express.Router();

/**
 * API: 设置企业版本规则（管理接口）
 * POST /api/rules
 */
adminRouter.post('/api/rules', async (req, res) => {
  try {
    const { enterprise_id, version_tag, ttl } = req.body || {};

    if (!enterprise_id || !version_tag) {
      return res.status(400).json({
        error: '缺少必要参数: enterprise_id, version_tag',
      });
    }

    // 判断：同一个企业是否已经在其他“路由/版本”上配置
    // 当前实现里，规则是 enterprise_id -> version_tag
    // 如果已存在且版本不同，则认为是冲突，提示调用方
    const rules = ruleEngine.getDefaultRules();
    const existed = rules[enterprise_id];

    if (existed && existed !== version_tag) {
      return res.status(409).json({
        error: '同一个企业在不同版本上已有配置，请先删除原有配置后再重新设置',
        enterprise_id,
        existed_version: existed,
        new_version: version_tag,
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
 * GET /api/rules
 */
adminRouter.get('/api/rules', (req, res) => {
  const rules = ruleEngine.getDefaultRules();
  res.json({ rules });
});

/**
 * API: 删除企业版本规则
 * DELETE /api/rules/:enterprise_id
 */
adminRouter.delete('/api/rules/:enterprise_id', async (req, res) => {
  const { enterprise_id } = req.params;

  if (!enterprise_id) {
    return res.status(400).json({ error: 'enterprise_id 不能为空' });
  }

  const rules = ruleEngine.getDefaultRules();
  if (!rules[enterprise_id]) {
    return res.status(404).json({
      error: '该企业未配置灰度规则，无需删除',
      enterprise_id,
    });
  }

  try {
    await ruleEngine.deleteVersionRule(enterprise_id);
    res.json({
      success: true,
      message: '规则已删除',
      enterprise_id,
    });
  } catch (error) {
    console.error('删除规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;


