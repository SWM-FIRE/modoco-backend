export default () => ({
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID || '',
  KAKAO_CALLBACK_URL:
    process.env.KAKAO_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/kakao/oauth',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CALLBACK_URL:
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/github/oauth',
});
