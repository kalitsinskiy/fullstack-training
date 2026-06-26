import { describe, expect, test } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from './useAuth';

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  return { wrapper, queryClient };
}

describe('useAuth', () => {
  test('starts as not authenticated with no token', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('login stores the token and populates the user from GET /me', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('me@example.com', 'SecretPass1');
    });

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(result.current.user?.email).toBe('me@example.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('logout clears the token, the user & the query cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    queryClient.setQueryData(['rooms'], [{ id: 'r1', name: 'Old' }]);

    await act(async () => {
      await result.current.login('me@example.com', 'SecretPass1');
    });

    act(() => {
      result.current.logout();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(localStorage.getItem('token')).toBeNull();
    expect(queryClient.getQueryData(['rooms'])).toBeUndefined();
  });
});
