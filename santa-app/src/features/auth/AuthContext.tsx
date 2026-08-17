import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { api, tokenStore } from '@/lib/api';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!tokenStore.get()) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>('/api/users/me');
      setUser(data);
    } catch (err) {
      // The axios interceptor already handles 401 (clears token + redirects).
      // Only clear state here for explicit auth rejections; keep the token for
      // transient failures (network blips, 5xx during deploys) so the user
      // isn't silently logged out.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        tokenStore.clear();
        setUser(null);
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
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
