/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  // The app uses module: "nodenext"; tsconfig.test.json switches the Jest
  // transform to CommonJS (and node resolution) so ts-jest runs without ESM
  // gymnastics, while still extending the base config.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
