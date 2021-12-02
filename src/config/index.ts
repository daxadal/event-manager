import dotenv from 'dotenv';

dotenv.config();

export default {
  api: {
    PORT: '3000',
    DEV: process.env.DEVELOPMENT_API
      ? process.env.DEVELOPMENT_API === 'true'
      : false,
  },
  db: {
    URL: process.env.MONGO_URL as string,
  },
  socket: {
    PORT: '40718',
  },
  jwt: {
    TOKEN_SECRET: process.env.TOKEN_SECRET as string,
  },
  bree: {
    BREE_SECRET: process.env.BREE_SECRET as string,
    START: process.env.START_REMINDERS
      ? process.env.START_REMINDERS !== 'false'
      : true,
  },
  pass: {
    SECRET: process.env.PASS_SECRET as string,
  },
  mocha: {
    SOCKET_VERBOSE: process.env.MOCHA_SOCKET_VERBOSE
      ? process.env.MOCHA_SOCKET_VERBOSE === 'true'
      : false,
  },
};
