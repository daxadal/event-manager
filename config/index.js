require('dotenv').config();

module.exports = {
  api: {
    DOMAIN: process.env.API_DOMAIN || 'http://localhost',
    PORT: process.env.API_PORT || '3000',
    DEV: process.env.DEVELOPMENT_API
      ? process.env.DEVELOPMENT_API === 'true'
      : false,
  },
  db: {
    DOMAIN: process.env.DB_DOMAIN || 'mongodb://localhost',
    PORT: process.env.DB_PORT || '27017',
    DB_NAME: process.env.DB_NAME || 'WhisbiEventManager',
  },
  socket: {
    DOMAIN:
      process.env.SOCKET_DOMAIN || process.env.API_DOMAIN || 'http://localhost',
    PORT: process.env.SOCKET_PORT || '40718',
  },
  jwt: {
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '8h',
  },
  bree: {
    INTERVAL: process.env.REMINDER_INTERVAL || '1m', // Every minute,
    MINUTES_AHEAD: process.env.REMINDER_MINUTES_AHEAD
      ? parseInt(process.env.REMINDER_MINUTES_AHEAD, 10)
      : 1440, // 1440 minutes = 24 hours
    START: process.env.START_REMINDERS
      ? process.env.START_REMINDERS !== 'false'
      : true,
  },
  pass: {
    SECRET: process.env.PASS_SECRET,
  },
  dos: {
    EVENT_SIZE: process.env.EVENT_SIZE || '1kb',
    EVENT_RPM: process.env.EVENT_RPM
      ? parseInt(process.env.EVENT_RPM, 10)
      : 100,
    USER_SIZE: process.env.USER_SIZE || '512b',
    USER_RPM: process.env.USER_RPM ? parseInt(process.env.USER_RPM, 10) : 30,
    MAIN_SIZE: process.env.MAIN_SIZE || '128b',
    MAIN_RPM: process.env.MAIN_RPM ? parseInt(process.env.MAIN_RPM, 10) : 10,
  },
};
