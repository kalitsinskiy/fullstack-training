import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { api, tokenStore } from '@/lib/api';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True when the last profile load failed for a reason other than an invalid session (network/5xx) — the token is still intact and worth retrying. */
  authError: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  retryLoadProfile: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!tokenStore.get()) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>('/api/users/me');
      setUser(data);
      setAuthError(false);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403) {
        // Only an invalid/expired session should log the user out.
        tokenStore.clear();
        setUser(null);
        setAuthError(false);
      } else {
        // Network error or 5xx during a deploy — keep the token so the user
        // isn't silently logged out over a flaky connection; surface a
        // retry state instead.
        setAuthError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore session on first mount.
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const login = useCallback(
    async (token: string) => {
      tokenStore.set(token);
      setIsLoading(true);
      await loadProfile();
    },
    [loadProfile],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setAuthError(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      authError,
      login,
      logout,
      retryLoadProfile: loadProfile,
    }),
    [user, isLoading, authError, login, logout, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
