# 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制环境变量文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，至少修改以下配置：

```env
PORT=3000
JWT_SECRET=your-secret-key-here
USE_REDIS=false
USE_OSS=false
LOCAL_RESOURCE_BASE_PATH=./resources
```

## 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 4. 测试访问

### 方式一：直接访问（使用默认企业 ID）

在浏览器中访问：`http://localhost:3000`

系统会使用默认的 `enterprise_id`，返回默认版本的页面。

### 方式二：使用 Cookie 设置企业 ID

1. 生成测试 token：
```bash
npm run generate-token enterprise-a
```

2. 在浏览器控制台中设置 Cookie：
```javascript
document.cookie = "access_token=<生成的token>";
```

3. 刷新页面，查看不同版本的页面。

### 方式三：使用 curl 测试

```bash
# 生成 token
TOKEN=$(node scripts/generate-test-token.js enterprise-a | grep "Token:" | cut -d' ' -f2)

# 访问首页
curl -H "Cookie: access_token=$TOKEN" http://localhost:3000/
```

## 5. 测试不同企业

### 测试企业 A（2.0.0-beta 版本）

```bash
# 生成 token
npm run generate-token enterprise-a

# 设置 Cookie 后访问
```

### 测试企业 B（1.8.0-stable 版本）

```bash
# 生成 token
npm run generate-token enterprise-b

# 设置 Cookie 后访问
```

## 6. API 测试

### 获取当前配置

```bash
curl http://localhost:3000/api/config
```

### 查看所有规则

```bash
curl http://localhost:3000/api/rules
```

### 设置新规则

```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "enterprise_id": "enterprise-c",
    "version_tag": "2.0.0-beta",
    "ttl": 3600
  }'
```

## 7. 验证动态注入

访问首页后，打开浏览器开发者工具，在控制台中输入：

```javascript
console.log(window.__APP_CONFIG__);
```

应该能看到类似以下的配置对象：

```javascript
{
  "enterprise_id": "enterprise-a",
  "theme": "blue",
  "feature_flags": ["feature1", "feature2"],
  "api_base_url": "/api/v2"
}
```

## 常见问题

### Q: 访问首页显示 404 错误？

A: 确保 `resources` 目录下有对应版本的 `index.html` 文件。检查目录结构：
```
resources/
├── 2.0.0-beta/index.html
├── 1.8.0-stable/index.html
└── default/index.html
```

### Q: JWT 解析失败？

A: 确保 `.env` 文件中的 `JWT_SECRET` 与生成 token 时使用的密钥一致。

### Q: 如何切换使用 Redis？

A: 在 `.env` 文件中设置：
```env
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Q: 如何切换使用 OSS？

A: 在 `.env` 文件中设置：
```env
USE_OSS=true
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-key
OSS_ACCESS_KEY_SECRET=your-secret
OSS_BUCKET=your-bucket
```

