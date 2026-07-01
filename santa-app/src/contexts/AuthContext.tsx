import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface RawUser {
  _id: string;
  email: string;
  displayName: string;
}

function toUser(raw: RawUser): User {
  return { id: raw._id, email: raw.email, displayName: raw.displayName };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
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
    api
      .get<RawUser>("/users/me")
      .then((me) => {
        setToken(stored);
        setUser(toUser(me));
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(email: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>(
      "/auth/login",
      { email, password },
    );
    localStorage.setItem("token", accessToken);
    const me = await api.get<RawUser>("/users/me");
    setToken(accessToken);
    setUser(toUser(me));
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const res = await api.post<User & { accessToken: string }>(
      "/auth/register",
      { email, password, displayName },
    );
    localStorage.setItem("token", res.accessToken);
    setToken(res.accessToken);
    setUser({ id: res.id, email: res.email, displayName: res.displayName });
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
