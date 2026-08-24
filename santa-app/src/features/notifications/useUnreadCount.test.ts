import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { useUnreadCount } from './useUnreadCount';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUnreadCount', () => {
  it('returns 0 before data loads', () => {
    server.use(http.get('/api/notifications', () => new Promise(() => {})));
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    expect(result.current).toBe(0);
  });

  it('returns the unreadCount from the API response', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [],
          unreadCount: 5,
          meta: { total: 10, page: 1, limit: 1, totalPages: 10 },
        }),
      ),
    );
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(5));
  });

  it('returns 0 when unreadCount is 0', async () => {
    server.use(
      http.get('/api/notifications', () =>
        HttpResponse.json({
          data: [],
          unreadCount: 0,
          meta: { total: 0, page: 1, limit: 1, totalPages: 0 },
        }),
      ),
    );
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(0));
  });
});
