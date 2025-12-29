import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * 身份认证中间件
 * 从 Cookie 或 Authorization Header 中解析 JWT，提取 enterprise_id
 */
export const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // 1. 优先从 Cookie 中获取
    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    }
    // 2. 其次从 Authorization Header 中获取
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // 如果没有 token，设置默认的 enterprise_id（用于演示）
      // 生产环境可能需要返回 401
      req.enterprise_id = req.cookies?.enterprise_id || 'default';
      return next();
    }

    // 解析 JWT
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.enterprise_id = decoded.enterprise_id || decoded.enterpriseId || decoded.enterprise;
      req.user = decoded;
    } catch (err) {
      // JWT 解析失败，使用默认值
      console.warn('JWT 解析失败:', err.message);
      req.enterprise_id = req.cookies?.enterprise_id || 'default';
    }

    next();
  } catch (error) {
    console.error('身份认证中间件错误:', error);
    req.enterprise_id = 'default';
    next();
  }
};

/**
 * 创建测试用的 JWT token（仅用于开发）
 */
export const createTestToken = (enterpriseId) => {
  return jwt.sign(
    { enterprise_id: enterpriseId, iat: Math.floor(Date.now() / 1000) },
    config.jwt.secret,
    { expiresIn: '24h' }
  );
};

