import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Start MSW once, reset handlers between tests, and stop it at the end.
// `onUnhandledRequest: 'error'` makes any un-mocked request fail loudly — add a
// handler in mocks/handlers.ts (or server.use(...) in a test) for each call.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
