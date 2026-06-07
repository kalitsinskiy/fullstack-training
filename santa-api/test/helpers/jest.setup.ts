import { expect } from '@jest/globals';

interface StatusCodeResponse {
  statusCode: number;
}

declare module 'expect' {
  interface Matchers<R> {
    toBeUnauthorized(): R;
  }
}

expect.extend({
  toBeUnauthorized(received: StatusCodeResponse) {
    const pass = received.statusCode === 401;
    return {
      pass,
      message: () =>
        pass
          ? 'expected response not to be 401 Unauthorized'
          : `expected response to be 401 Unauthorized, got ${received.statusCode}`,
    };
  },
});
