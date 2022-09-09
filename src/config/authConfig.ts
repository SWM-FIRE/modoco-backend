export default () => ({
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID || '',
  KAKAO_CALLBACK_URL:
    process.env.KAKAO_CALLBACK_URL ||
    'http://localhost:3333/api/v1/auth/kakao/callback',
});
