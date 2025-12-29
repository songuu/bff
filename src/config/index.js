import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    cookieName: process.env.JWT_COOKIE_NAME || 'access_token',
  },
  cache: {
    useRedis: process.env.USE_REDIS === 'true',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    memory: {
      stdTTL: 3600, // 1 小时
      checkperiod: 600, // 10 分钟
    },
  },
  storage: {
    useOSS: process.env.USE_OSS === 'true',
    oss: {
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
    },
    local: {
      basePath: process.env.LOCAL_RESOURCE_BASE_PATH || join(__dirname, '../../resources'),
    },
  },
};

