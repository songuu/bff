import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * 生成测试用的 JWT token
 */
function generateToken(enterpriseId) {
  const payload = {
    enterprise_id: enterpriseId,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  return token;
}

// 从命令行参数获取 enterprise_id
const enterpriseId = process.argv[2] || 'enterprise-a';

const token = generateToken(enterpriseId);

console.log('\n✅ 测试 Token 已生成\n');
console.log('企业 ID:', enterpriseId);
console.log('Token:', token);
console.log('\n使用方法:');
console.log(`1. Cookie: Set-Cookie: access_token=${token}`);
console.log(`2. Header: Authorization: Bearer ${token}`);
console.log(`3. 浏览器控制台: document.cookie = "access_token=${token}"\n`);

