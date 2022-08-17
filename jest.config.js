/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: "<rootDir>/",
});

process.env.WINSTON_CONSOLE_LEVEL = "none";

process.env.WINSTON_FILE_LEVEL = "info";
process.env.WINSTON_FILE_PREFIX = "__jest__";

process.env.WINSTON_SLACK_LEVEL = "none";
process.env.WINSTON_SLACK_PRIORITY_WEBHOOK = undefined;
process.env.WINSTON_SLACK_NON_PRIORITY_WEBHOOK = undefined;

let preset;
if (process.env.CI) {
  preset = undefined;
  process.env.MONGO_URL = "mongodb://mongo-docker:27017/EventManager";
} else {
  preset = "@shelf/jest-mongodb";
}

module.exports = {
  preset,
  reporters: ["default", "jest-junit"],

  roots: ["test"],
  testMatch: ["**/?(*.)+(spec|test).+(ts|js)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  moduleNameMapper: {
    ...moduleNameMapper,
    "^test/(.*)$": "<rootDir>/test/$1",
  },
  testTimeout: 10000,
};
