export default () => ({
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID || '',
  KAKAO_CALLBACK_URL:
    process.env.KAKAO_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/kakao/oauth',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CALLBACK_URL:
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/github/oauth',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/google/oauth',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  FRONTEND_URL: 'https://modocode.com',
  AUTH_FRONTEND_URL: 'https://modocode.com/auth',
});
