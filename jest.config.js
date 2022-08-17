/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: "<rootDir>/",
});

process.env.WINSTON_CONSOLE_LEVEL = "none";
process.env.WINSTON_SLACK_LEVEL = "none";

process.env.WINSTON_FILE_LEVEL = "info";
process.env.WINSTON_FILE_PREFIX = "_jest_";

process.env.DISABLE_MOCKED_WARNING = true;

module.exports = {
  preset: "@shelf/jest-mongodb",
  reporters: ["default", "jest-junit"],

  roots: ["./test"],
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
