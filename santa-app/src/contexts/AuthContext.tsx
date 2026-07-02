import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextType, type User } from "./auth-context";
import { api } from "../services/api";
import { queryClient } from "../main";

const TOKEN_STORAGE_KEY = "token";

async function fetchCurrentUser(): Promise<User> {
  return api.get<User>("/users/me");
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }
      if (isMounted) setToken(savedToken);

      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>(
      "/auth/login",
      { email, password },
    );

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const { accessToken } = await api.post<{
      id: string;
      email: string;
      displayName: string;
      accessToken: string;
    }>("/auth/register", { email, password, displayName });

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: user !== null,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
