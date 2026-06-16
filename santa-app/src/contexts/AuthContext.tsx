/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { type User } from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('token'));
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('token');

    if (!stored) {
      return;
    }

    api
      .get<User>('/api/users/me')
      .then((u) => {
        setToken(stored);
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function register(email: string, password: string, displayName: string) {
    await api.post('/api/auth/register', { email, password, displayName });
  }

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>('/api/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', accessToken);

    try {
      const me = await api.get<User>('/api/users/me');

      setToken(accessToken);
      setUser(me);
    } catch (err) {
      localStorage.removeItem('token');
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, register, login, logout, isAuthenticated: user !== null }}
    >
      {children}
    </AuthContext.Provider>
  );
}
