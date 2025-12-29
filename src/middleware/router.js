/**
 * 路由发现和分发中间件
 * 可以根据请求路径、企业 ID 等条件进行路由分发
 */
export const routerMiddleware = (req, res, next) => {
  // 可以在这里实现更复杂的路由逻辑
  // 例如：根据路径前缀、企业类型等进行路由分发
  
  // 记录路由信息
  req.routeInfo = {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  next();
};

/**
 * 路由发现服务
 * 可以动态发现和注册路由
 */
class RouterDiscovery {
  constructor() {
    this.routes = new Map();
  }

  /**
   * 注册路由
   * @param {string} path - 路由路径
   * @param {string} method - HTTP 方法
   * @param {Function} handler - 处理函数
   */
  registerRoute(path, method, handler) {
    const key = `${method.toUpperCase()}:${path}`;
    this.routes.set(key, handler);
    console.log(`✅ 路由已注册: ${key}`);
  }

  /**
   * 发现路由（查找匹配的路由）
   * @param {string} path - 请求路径
   * @param {string} method - HTTP 方法
   * @returns {Function|null} - 匹配的处理函数
   */
  discoverRoute(path, method) {
    const key = `${method.toUpperCase()}:${path}`;
    return this.routes.get(key) || null;
  }

  /**
   * 获取所有已注册的路由
   * @returns {Array}
   */
  getAllRoutes() {
    return Array.from(this.routes.keys());
  }
}

// 导出单例
export const routerDiscovery = new RouterDiscovery();

