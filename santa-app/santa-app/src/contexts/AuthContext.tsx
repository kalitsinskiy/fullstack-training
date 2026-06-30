import { createContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import { queryClient } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface RawUser {
  _id?: string;
  id?: string;
  email: string;
  displayName: string;
}

function mapUser(raw: RawUser): User {
  return { id: raw._id ?? raw.id ?? '', email: raw.email, displayName: raw.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('token'));

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }

  useEffect(() => {
    api.setUnauthorizedHandler(logout);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) return;
    api
      .get<RawUser>('/api/users/me')
      .then((raw) => {
        setToken(stored);
        setUser(mapUser(raw));
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const { accessToken } = await api.post<{ accessToken: string }>('/api/auth/login', {
      email,
      password,
    });
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    const raw = await api.get<RawUser>('/api/users/me');
    const fetchedUser = mapUser(raw);
    setUser(fetchedUser);
    return fetchedUser;
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    const raw = await api.post<RawUser & { accessToken: string }>('/api/auth/register', {
      email,
      password,
      displayName,
    });
    localStorage.setItem('token', raw.accessToken);
    setToken(raw.accessToken);
    const fetchedUser = mapUser(raw);
    setUser(fetchedUser);
    return fetchedUser;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
export type { AuthContextType };
