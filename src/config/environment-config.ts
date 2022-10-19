import { join } from 'path';

export default () => ({
  ENV: parseInt(process.env.PORT, 10) || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3333/api/v1',
  NOTION_URL: `https://fortune-innocent-45c.notion.site/1-e022efdd1581461b994469a56af037f8`,
  API_VERSION: 'v1',
  EMAIL_SOURCE: process.env.EMAIL_SOURCE || 'modocode.com',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  STATIC_ASSETS_PATH: join(__dirname, '..', 'static'),
  CSP_POLICY: {
    defaultSrc: [`'self'`],
    styleSrc: [`'self'`, `'unsafe-inline'`],
    imgSrc: [`'self'`, 'data:', 'validator.swagger.io'], // validator.swagger.io is used for swagger-ui
    scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
  },
  CORS_ALLOWLIST: [
    'https://modocode.com',
    /https:\/\/.+\.modocode\.com$/,
    'https://xn--hq1br4kwqt.com',
    /https:\/\/.+\.xn--hq1br4kwqt\.com$/,
    /https:\/\/.+\.do65qrifiozf1\.amplifyapp\.com$/,
    'http://localhost:3000',
    'https://localhost:3000',
  ],
  AWS_REGION: 'ap-northeast-2',
  DATABASE: {
    HOST:
      process.env.DATABASE_URL || 'postgres://soma13:myPasswd@localhost:5432',
    PORT: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
  REDIS: {
    HOST: process.env.REDIS_URL || 'redis://localhost:6379',
    HOST_NAME: process.env.REDIS_HOST_NAME || 'redis',
    PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || '',
  },
  AVATAR_MAX_COUNT: 30,
});