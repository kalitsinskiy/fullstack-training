/**
 * Shared infrastructure mocks for the e2e suite — loaded for EVERY *.e2e-spec.ts
 * via `setupFilesAfterEnv` (test/jest-e2e.json), before the spec's imports run.
 */

// `jest.requireActual` rather than a bare `require()` — same result, but it
// satisfies the no-require-imports lint rule that applies to test/**/*.ts.
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

jest.mock('amqplib', () => {
  const publish = jest.fn();

  const channel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    publish,
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const connection = {
    createChannel: jest.fn().mockResolvedValue(channel),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return { connect: jest.fn().mockResolvedValue(connection) };
});
