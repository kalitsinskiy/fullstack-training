import { useAuth } from "../contexts/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function useApi() {
  const { token, logout } = useAuth();

  async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  return {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, body: unknown) =>
      request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  };
}
