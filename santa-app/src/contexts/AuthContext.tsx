import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json() as Promise<User>;
      })
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(email: string, password: string) {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) throw new Error("Invalid credentials");
    const { accessToken } = (await loginRes.json()) as { accessToken: string };

    const meRes = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) throw new Error("Failed to load profile");
    const me = (await meRes.json()) as User;

    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setUser(me);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
