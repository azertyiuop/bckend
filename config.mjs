export const SERVER_CONFIG = {
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'ovgTa(yajGPtvzB7y[#nL}CkO`Z8afl&',

  ADMIN_ACCESS_CODES: process.env.ADMIN_ACCESS_CODES
    ? process.env.ADMIN_ACCESS_CODES.split(',')
    : ['ADMIN_BOLT_2025', 'SUPERADMIN_2025', 'ADMIN123'],

  MODERATOR_PASSWORDS: {
    'mod': 'mod123',
    'moderator': 'moderator123',
    'admin': 'admin123'
  },

  WS_PORT: parseInt(process.env.PORT) || 3001,
  API_PORT: parseInt(process.env.API_PORT) || 3002,
  RTMP_PORT: parseInt(process.env.RTMP_PORT) || 1935,
  HTTP_PORT: parseInt(process.env.HTTP_PORT) || 8003,

  DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'MTQyMzAwNjgyMjI1OTc1NzExOA.GLI6iY.OEms4nabRQ4eEsCm7eSieRDY1WYXUi8zqLppjo'
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1410403207347310592/C_OEyiIhN4lVBiDq85lXJFCuYNk-9103OjFOrq64-NY4K4P3g4e8bLc5Kvt9XaGMlET1',

  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'],

  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_change_in_production',

  DATABASE_URL: process.env.DATABASE_URL || null,
  DB_TYPE: process.env.DB_TYPE || null
};
