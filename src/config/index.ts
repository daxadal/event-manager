import dotenv from 'dotenv';

import { parseBoolean, parseEnvString } from './types-helpers';

const { error, parsed } = dotenv.config();

const parsingErrors: string[] = [];

export const api = {
  PORT: '3000',
  DEV: parseBoolean('DEVELOPMENT_API', parsingErrors),
};

export const db = {
  URL: parseEnvString('MONGO_URL', parsingErrors),
};

export const socket = {
  PORT: '40718',
};

export const jwt = {
  TOKEN_SECRET: parseEnvString('TOKEN_SECRET', parsingErrors),
};

export const bree = {
  BREE_SECRET: parseEnvString('BREE_SECRET', parsingErrors),
  START: parseBoolean('START_REMINDERS', parsingErrors),
};

export const pass = {
  SECRET: parseEnvString('PASS_SECRET', parsingErrors),
};

export const mocha = {
  SOCKET_VERBOSE: parseBoolean('MOCHA_SOCKET_VERBOSE', parsingErrors),
};

export const configDebug = { dotenv: { error, parsed }, parsingErrors };
