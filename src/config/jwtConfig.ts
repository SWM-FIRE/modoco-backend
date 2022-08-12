export default () => ({
  JWT_SECRET: process.env.JWT_SECRET || 'very-very-secret',
  JWT_EXPIRES_IN: '1d',
});
