import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Initial router entry, e.g. '/rooms/123'. Defaults to '/'. */
  route?: string;
}

/**
 * Render a component inside the same providers the real app uses — Query client,
 * Auth context and a router. Use this for every component/page test instead of
 * RTL's bare `render`, so hooks like `useAuth` / `useQuery` / `useNavigate` work.
 */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...rtlOptions } = options;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rtlOptions });
}

// Re-export everything from RTL so tests import from one place.
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
