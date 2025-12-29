import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config/index.js';
import { authMiddleware } from './middleware/auth.js';
import { routerMiddleware } from './middleware/router.js';
import routes from './routes/index.js';
import { ruleEngine } from './services/ruleEngine.js';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 路由发现中间件
app.use(routerMiddleware);

// 身份认证中间件（在所有路由之前）
app.use(authMiddleware);

// 注册路由
app.use('/', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '内部服务器错误',
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: '路由未找到',
    path: req.path,
  });
});

// 初始化默认规则
async function initializeRules() {
  // 可以在这里从配置文件或数据库加载规则
  const defaultRules = {
    'enterprise-a': '2.0.0-beta',
    'enterprise-b': '1.8.0-stable',
    'default': '1.8.0-stable',
  };
  
  await ruleEngine.setRules(defaultRules);
  console.log('✅ 默认规则已初始化');
}

// 启动服务器
async function startServer() {
  try {
    // 初始化规则
    await initializeRules();

    // 启动 HTTP 服务器
    const port = config.server.port;
    app.listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║          BFF 服务器已启动                             ║
╠═══════════════════════════════════════════════════════╣
║  端口: ${port.toString().padEnd(47)}║
║  环境: ${config.server.env.padEnd(47)}║
║  缓存: ${(config.cache.useRedis ? 'Redis' : '内存').padEnd(47)}║
║  存储: ${(config.storage.useOSS ? 'OSS' : '本地磁盘').padEnd(47)}║
╚═══════════════════════════════════════════════════════╝
      `);
      console.log(`\n访问 http://localhost:${port} 查看首页`);
      console.log(`访问 http://localhost:${port}/api/config 查看配置`);
      console.log(`访问 http://localhost:${port}/api/rules 查看规则\n`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 启动服务器
startServer();

