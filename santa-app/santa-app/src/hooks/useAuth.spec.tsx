import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/services/api';
import { server, API_URL, ALICE, tokenFor } from '@/test/msw-server';
import { useAuth } from './useAuth';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  test('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  test('login stores the token and populates the user from GET /api/users/me', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(ALICE.email, ALICE.password);
    });

    expect(localStorage.getItem('token')).toBe(tokenFor(ALICE.email));
    expect(result.current.token).toBe(tokenFor(ALICE.email));
    expect(result.current.user).toEqual({
      id: ALICE.id,
      email: ALICE.email,
      displayName: ALICE.displayName,
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('logout clears the token and the query cache', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(ALICE.email, ALICE.password);
    });

    queryClient.setQueryData(['probe'], 'cached-value');
    expect(queryClient.getQueryData(['probe'])).toBe('cached-value');

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(queryClient.getQueryData(['probe'])).toBeUndefined();
  });

  test('a 401 on an authenticated request logs the user out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(ALICE.email, ALICE.password);
    });
    expect(result.current.isAuthenticated).toBe(true);

    server.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json({ message: 'Session expired' }, { status: 401 }),
      ),
    );

    await expect(api.get('/api/rooms')).rejects.toThrow('Session expired. Please log in again.');

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(localStorage.getItem('token')).toBeNull();
  });
});
