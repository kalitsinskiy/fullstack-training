import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';

interface RenderAppOptions {
  route?: string;
  /** Pre-seed localStorage so AuthProvider boots up already logged in. */
  token?: string;
}

// One wrapper mirroring main.tsx: QueryClient (the real singleton, so
// AuthContext's queryClient.clear() on logout is observable) + AuthProvider +
// MemoryRouter (instead of BrowserRouter, for per-test route isolation).
export function renderApp(ui: ReactElement, { route = '/', token }: RenderAppOptions = {}) {
  if (token) localStorage.setItem('token', token);

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
