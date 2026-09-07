import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Start MSW once, reset handlers between tests, and stop it at the end.
// `onUnhandledRequest: 'error'` makes any un-mocked request fail loudly — add a
// handler in mocks/handlers.ts (or server.use(...) in a test) for each call.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
