import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

const TOKEN_KEY = 'santa.accessToken';

const FAKE_USER = {
  id: 'user-1',
  email: 'alice@test.com',
  displayName: 'Alice',
  role: 'user' as const,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.removeItem(TOKEN_KEY);
});

describe('useAuth', () => {
  test('starts unauthenticated when no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('restores session from stored token on mount', async () => {
    localStorage.setItem(TOKEN_KEY, 'fake-token');
    server.use(http.get('/api/users/me', () => HttpResponse.json(FAKE_USER)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(FAKE_USER.email);
  });

  test('clears token if /api/users/me 401s during session restore', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  test('login stores token and calls GET /api/users/me to populate user', async () => {
    server.use(http.get('/api/users/me', () => HttpResponse.json(FAKE_USER)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('fake-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe(FAKE_USER.id);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('fake-token');
  });

  test('logout clears token, user, and query cache', async () => {
    localStorage.setItem(TOKEN_KEY, 'fake-token');
    server.use(http.get('/api/users/me', () => HttpResponse.json(FAKE_USER)));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['rooms', 1], { data: [], meta: {} });

    const testWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper: testWrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(queryClient.getQueryData(['rooms', 1])).toBeUndefined();
  });
});
