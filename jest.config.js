const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: '<rootDir>/',
});
module.exports = {
  preset: '@shelf/jest-mongodb',
  reporters: ['default', 'jest-junit'],

  globalSetup: '<rootDir>/jest.setup.js',

  roots: ['./test'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|js)'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  moduleNameMapper: {
    ...moduleNameMapper,
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  testTimeout: 10000,
};
