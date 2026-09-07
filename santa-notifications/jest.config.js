/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  // e2e/integration live in test/ (*.test.ts); pure unit specs live beside the
  // code they cover (src/**/*.spec.ts). Match both.
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  // Set required test env (JWT_SECRET, SERVICE_API_KEY, …) before any spec runs.
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  // This is an integration suite: buildApp() opens a real ioredis client whose
  // reconnect timer keeps the event loop alive after the tests finish. The app
  // is closed in afterEach, so the work is done — forceExit just stops Jest from
  // hanging on that timer. Run `jest --detectOpenHandles` if you suspect a leak.
  forceExit: true,
  // The app uses module: "nodenext"; tsconfig.test.json switches the Jest
  // transform to CommonJS (and node resolution) so ts-jest runs without ESM
  // gymnastics, while still extending the base config.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
