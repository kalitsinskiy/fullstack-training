import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from '@/lib/queryClient';
import { server } from './msw-server';

// The app's queryClient defaults to React Query's built-in 3-retry backoff,
// which makes any error-state test wait several real seconds. Tests want
// failures to surface immediately; production keeps the resilience.
// setDefaultOptions() replaces the whole object rather than merging, so the
// existing staleTime/throwOnError config must be spread back in.
const defaults = queryClient.getDefaultOptions();
queryClient.setDefaultOptions({
  ...defaults,
  queries: { ...defaults.queries, retry: false },
});

// MSW: start before tests, reset handlers/overrides between tests, close after
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  // queryClient and localStorage are module-level singletons (same ones the
  // app imports), so they must be reset between tests to avoid state leaking.
  queryClient.clear();
  localStorage.clear();
});

afterAll(() => server.close());
