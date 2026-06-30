import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextType, type User } from "./auth-context";
const TOKEN_STORAGE_KEY = "token";

function getBaseUrl() {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3001";
}

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
  } catch {
    // Response body is not JSON or is empty. Fall through to fallback message.
  }

  return fallbackMessage;
}

async function fetchCurrentUser(accessToken: string): Promise<User> {
  const meRes = await fetch(`${getBaseUrl()}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) {
    const message = await getErrorMessage(meRes, "Failed to load profile");
    throw new Error(message);
  }

  return (await meRes.json()) as User;
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
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setToken(savedToken);
      }

      try {
        const currentUser = await fetchCurrentUser(savedToken);
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const loginRes = await fetch(`${getBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      const message = await getErrorMessage(loginRes, "Invalid credentials");
      throw new Error(message);
    }

    const { accessToken } = (await loginRes.json()) as { accessToken: string };

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);

    try {
      const currentUser = await fetchCurrentUser(accessToken);
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }

  async function register(email: string, password: string, displayName: string) {
    const registerRes = await fetch(`${getBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!registerRes.ok) {
      const message = await getErrorMessage(registerRes, "Registration failed");
      throw new Error(message);
    }

    const { accessToken } = (await registerRes.json()) as { accessToken: string };

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);

    try {
      const currentUser = await fetchCurrentUser(accessToken);
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
