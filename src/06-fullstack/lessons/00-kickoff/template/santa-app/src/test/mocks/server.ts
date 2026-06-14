import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// The MSW server used by all component tests. Wired up in src/test/setup.ts.
export const server = setupServer(...handlers);
