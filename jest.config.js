const path = require('node:path');

module.exports = {
  rootDir: __dirname,

  // Prettier 3 is not supported by jest inline snapshots — disable it
  prettierPath: null,

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '<rootDir>/src/03-tests/**/*.test.{js,ts}',
  ],

  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: path.join(__dirname, 'config/.babelrc') }],
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
      },
      diagnostics: false,
    }],
  },

  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'node',

  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/01-javascript/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/02-typescript/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/03-tests/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/04-backend/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/06-algorithms/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/07-patterns/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/08-architecture/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/src/03-tests/**/*.test.{js,ts}',
      ],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: path.join(__dirname, 'config/.babelrc') }],
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            target: 'ES2020',
            module: 'commonjs',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: true,
            skipLibCheck: true,
          },
          diagnostics: false,
        }],
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/05-frontend/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
      ],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: path.join(__dirname, 'config/.babelrc') }],
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            target: 'ES2020',
            module: 'commonjs',
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
          },
          diagnostics: false,
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],

  collectCoverageFrom: [
    'src/**/exercises/**/*.{js,ts,jsx,tsx}',
    'src/03-tests/**/*.ts',
    '!src/03-tests/**/*.test.ts',
    '!src/**/examples/**',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/examples/',
  ],

  modulePaths: ['<rootDir>'],

  clearMocks: true,
  verbose: true,
};
