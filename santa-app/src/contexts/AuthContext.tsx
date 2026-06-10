/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const stored = localStorage.getItem('token');

    if (!stored) {
      return;
    }

    fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error('expired');
        if (!res.ok) throw new Error('failed');
        return res.json() as Promise<User>;
      })
      .then((u) => {
        setToken(stored);
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) throw new Error('Invalid credentials');

    const { accessToken } = (await loginRes.json()) as { accessToken: string };

    const meRes = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) throw new Error('Failed to load profile');

    const me = (await meRes.json()) as User;

    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(me);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, isAuthenticated: user !== null }}
    >
      {children}
    </AuthContext.Provider>
  );
}
