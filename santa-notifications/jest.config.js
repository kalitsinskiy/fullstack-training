const path = require('node:path');

module.exports = {
  rootDir: __dirname,

  // Prettier 3 is not supported by jest inline snapshots — disable it
  prettierPath: null,

  // Test match patterns
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,ts,jsx,tsx}'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
        },
        diagnostics: false,
      },
    ],
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
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,ts}'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              target: 'ES2020',
              module: 'commonjs',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              strict: true,
              skipLibCheck: true,
            },
            diagnostics: false,
          },
        ],
      },
    },
  ],

  collectCoverageFrom: ['src/**/*.{js,ts,jsx,tsx}', '!src/**/__tests__/**', '!**/node_modules/**'],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testPathIgnorePatterns: ['/node_modules/'],

  modulePaths: ['<rootDir>'],

  clearMocks: true,
  verbose: true,
};
