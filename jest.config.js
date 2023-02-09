/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: "<rootDir>/",
});

let preset;
if (process.env.CI) {
  preset = undefined;
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
