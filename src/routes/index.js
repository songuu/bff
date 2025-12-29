import express from 'express';
import businessRouter from './business.js';
import adminRouter from './admin.js';

/**
 * 路由聚合入口
 * - businessRouter: 面向真实业务流量（C 端 / 前端应用）
 * - adminRouter:    面向运营 / 管理后台
 */
const router = express.Router();

// 业务路由
router.use('/', businessRouter);

// 管理路由
router.use('/', adminRouter);

export default router;

