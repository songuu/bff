# BFF 服务器

一个完整的 Backend For Frontend (BFF) 服务器实现，支持路由发现、路由分发、身份认证、规则决策、资源读取和动态 HTML 注入。

## 功能特性

- ✅ **路由发现与分发**: 自动发现和分发路由请求
- ✅ **身份认证**: 从 Cookie/JWT 中解析用户身份，获取 `enterprise_id`
- ✅ **规则决策**: 根据 `enterprise_id` 查询匹配的 `version_tag`
- ✅ **资源读取**: 支持从 OSS 或本地磁盘读取对应版本的资源文件
- ✅ **动态注入**: 在返回 HTML 前注入企业特定的配置变量
- ✅ **缓存支持**: 支持内存缓存和 Redis 缓存
- ✅ **存储支持**: 支持 OSS 对象存储和本地文件系统

## 工作流程

```
用户访问 / 首页
    ↓
BFF 拦截请求，解析 Cookie/JWT 获取 enterprise_id
    ↓
BFF 访问缓存（内存/Redis），根据 enterprise_id 查询 version_tag
    ↓
BFF 根据 version_tag 从 OSS/本地磁盘读取对应版本的 index.html
    ↓
BFF 在 HTML 中注入企业配置：window.__APP_CONFIG__
    ↓
BFF 返回组装好的 HTML 内容
    ↓
浏览器根据 index.html 中的路径，自动去 CDN 加载对应版本的 JS/CSS
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `PORT`: 服务器端口（默认 3000）
- `JWT_SECRET`: JWT 密钥
- `USE_REDIS`: 是否使用 Redis（true/false）
- `USE_OSS`: 是否使用 OSS（true/false）
- `LOCAL_RESOURCE_BASE_PATH`: 本地资源路径（不使用 OSS 时）

### 3. 准备资源文件

如果使用本地存储，创建资源目录结构：

```
resources/
├── 2.0.0-beta/
│   └── index.html
├── 1.8.0-stable/
│   └── index.html
└── default/
    └── index.html
```

示例 `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>BFF 应用</title>
    <link rel="stylesheet" href="https://cdn.example.com/{{version}}/styles.css">
</head>
<body>
    <h1>欢迎使用 BFF 应用</h1>
    <div id="app"></div>
    <script src="https://cdn.example.com/{{version}}/app.js"></script>
</body>
</html>
```

### 4. 启动服务器

```bash
npm start
```

开发模式（自动重启）：

```bash
npm run dev
```

## API 接口

### 首页

```
GET /
```

返回根据企业 ID 动态注入配置的 HTML 页面。

### 获取配置

```
GET /api/config
```

返回当前企业的配置信息。

### 设置规则

```
POST /api/rules
Content-Type: application/json

{
  "enterprise_id": "enterprise-a",
  "version_tag": "2.0.0-beta",
  "ttl": 3600
}
```

### 获取所有规则

```
GET /api/rules
```

## 身份认证

BFF 支持两种方式获取 `enterprise_id`：

1. **Cookie**: 从名为 `access_token` 的 Cookie 中解析 JWT
2. **Authorization Header**: 从 `Authorization: Bearer <token>` 中解析 JWT

JWT payload 应包含 `enterprise_id` 字段：

```json
{
  "enterprise_id": "enterprise-a",
  "iat": 1234567890
}
```

### 测试 Token 生成

可以使用提供的脚本生成测试 token：

```bash
# 生成默认企业（enterprise-a）的 token
npm run generate-token

# 生成指定企业的 token
npm run generate-token enterprise-b
```

生成的 token 可以通过以下方式使用：

1. **浏览器 Cookie**:
   ```javascript
   document.cookie = "access_token=<生成的token>";
   ```

2. **curl 请求**:
   ```bash
   curl -H "Cookie: access_token=<生成的token>" http://localhost:3000/
   ```

3. **Authorization Header**:
   ```bash
   curl -H "Authorization: Bearer <生成的token>" http://localhost:3000/
   ```

## 规则配置

默认规则映射：

- `enterprise-a` → `2.0.0-beta`
- `enterprise-b` → `1.8.0-stable`
- `default` → `1.8.0-stable`

可以通过 API 动态更新规则，规则会缓存到 Redis 或内存中。

## 动态注入配置

BFF 会在返回的 HTML 中注入 `window.__APP_CONFIG__` 对象：

```javascript
window.__APP_CONFIG__ = {
  "enterprise_id": "enterprise-a",
  "theme": "blue",
  "feature_flags": ["feature1", "feature2"],
  "api_base_url": "/api/v2"
}
```

配置会根据企业 ID 自动生成，也可以通过 API 自定义。

## 项目结构

```
bff/
├── src/
│   ├── config/          # 配置文件
│   ├── middleware/      # 中间件（认证、路由）
│   ├── routes/          # 路由定义
│   ├── services/        # 服务层（缓存、存储、规则引擎、HTML注入）
│   └── index.js         # 应用入口
├── resources/           # 本地资源文件（可选）
├── .env.example         # 环境变量示例
├── package.json
└── README.md
```

## 依赖说明

- `express`: Web 框架
- `cookie-parser`: Cookie 解析
- `jsonwebtoken`: JWT 解析
- `ioredis`: Redis 客户端
- `node-cache`: 内存缓存
- `ali-oss`: 阿里云 OSS 客户端
- `dotenv`: 环境变量管理
- `cors`: 跨域支持

## 生产环境建议

1. **安全性**:
   - 修改默认的 `JWT_SECRET`
   - 启用 HTTPS
   - 添加请求限流
   - 验证和清理用户输入

2. **性能**:
   - 使用 Redis 缓存
   - 启用 CDN
   - 添加响应压缩
   - 实现资源缓存策略

3. **监控**:
   - 添加日志记录
   - 集成监控系统
   - 添加健康检查端点

4. **扩展性**:
   - 使用负载均衡
   - 实现服务发现
   - 添加配置中心

## 许可证

MIT

