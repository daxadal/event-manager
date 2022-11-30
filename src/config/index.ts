import dotenv from "dotenv";

import {
  parseBoolean,
  parseEnvString,
  parseEnvLogLevel,
  parseOptEnvString,
  LogLevel,
} from "./types-helpers";

export { LogLevel };

const { error, parsed } = dotenv.config();

const parsingErrors: string[] = [];

export const api = {
  PORT: "3000",
};

export const db = {
  URL: parseEnvString("MONGO_URL", parsingErrors),
};

export const socket = {
  PORT: "40718",
  CORS_ORIGINS: parseEnvString("CORS_ORIGINS", parsingErrors),
};

export const jwt = {
  TOKEN_SECRET: parseEnvString("TOKEN_SECRET", parsingErrors),
};

export const cron = {
  START: parseBoolean("START_REMINDERS", parsingErrors),
};

export const pass = {
  SECRET: parseEnvString("PASS_SECRET", parsingErrors),
};

export const winston = {
  slack: {
    level: parseEnvLogLevel(
      "WINSTON_SLACK_LEVEL",
      LogLevel.NONE,
      parsingErrors
    ),
    webhooks: {
      priority: parseOptEnvString(
        "WINSTON_SLACK_PRIORITY_WEBHOOK",
        parsingErrors
      ),
      all: parseOptEnvString(
        "WINSTON_SLACK_NON_PRIORITY_WEBHOOK",
        parsingErrors
      ),
    },
  },
  console: {
    level: parseEnvLogLevel(
      "WINSTON_CONSOLE_LEVEL",
      LogLevel.INFO,
      parsingErrors
    ),
  },
  file: {
    level: parseEnvLogLevel("WINSTON_FILE_LEVEL", LogLevel.NONE, parsingErrors),
    prefix: parseOptEnvString("WINSTON_FILE_PREFIX", parsingErrors),
  },
};

export const configDebug = { dotenv: { error, parsed }, parsingErrors };
