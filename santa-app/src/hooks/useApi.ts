import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";

export function useApi() {
  const { token, logout } = useAuth();

  const request = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T> => {
      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as T;
    },
    [token, logout],
  );

  return useMemo(
    () => ({
      get: <T>(url: string) => request<T>(url),
      post: <T>(url: string, body: unknown) =>
        request<T>(url, { method: "POST", body: JSON.stringify(body) }),
    }),
    [request],
  );
}
