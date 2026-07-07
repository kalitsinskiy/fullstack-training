import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";

interface RenderAppOptions {
  /** Initial URL the in-memory router starts on. */
  route?: string;
  /** Reuse an existing client (e.g. to assert on cache/`clear()`). */
  queryClient?: QueryClient;
}

/**
 * Mirrors the provider tree from `main.tsx` (query client + auth context +
 * router), so every test renders components in the same environment the real
 * app runs in. Uses `MemoryRouter` for isolated, per-test history and
 * `retry: false` so failing queries surface immediately instead of retrying.
 *
 * Returns the RTL result plus the `queryClient` in use, for tests that need to
 * inspect or spy on the cache.
 */
export function renderApp(
  ui: ReactElement,
  { route = "/", queryClient }: RenderAppOptions = {},
) {
  const client =
    queryClient ??
    new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), queryClient: client };
}
