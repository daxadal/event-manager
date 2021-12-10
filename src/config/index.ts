import dotenv from 'dotenv';

dotenv.config();

export const api = {
  PORT: '3000',
  DEV: process.env.DEVELOPMENT_API
    ? process.env.DEVELOPMENT_API === 'true'
    : false,
};

export const db = {
  URL: process.env.MONGO_URL as string,
};

export const socket = {
  PORT: '40718',
};

export const jwt = {
  TOKEN_SECRET: process.env.TOKEN_SECRET as string,
};

export const bree = {
  BREE_SECRET: process.env.BREE_SECRET as string,
  START: process.env.START_REMINDERS
    ? process.env.START_REMINDERS !== 'false'
    : true,
};

export const pass = {
  SECRET: process.env.PASS_SECRET as string,
};

export const mocha = {
  SOCKET_VERBOSE: process.env.MOCHA_SOCKET_VERBOSE
    ? process.env.MOCHA_SOCKET_VERBOSE === 'true'
    : false,
};
