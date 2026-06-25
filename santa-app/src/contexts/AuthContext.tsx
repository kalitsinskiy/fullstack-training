import { useState, useEffect, type ReactNode } from "react";
import { api } from "../services/api";
import { queryClient } from "../main";
import { AuthContext, type User } from "./authTypes";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem("token"),
  );

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) return;
    api
      .get<User>("/api/users/me")
      .then((u) => {
        setToken(stored);
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>(
      "/api/auth/login",
      { email, password },
    );
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    const fetchedUser = await api.get<User>("/api/users/me");
    setUser(fetchedUser);
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const { accessToken, ...fetchedUser } = await api.post<{
      accessToken: string;
      id: string;
      email: string;
      displayName: string;
    }>("/api/auth/register", { email, password, displayName });
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setUser(fetchedUser);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
