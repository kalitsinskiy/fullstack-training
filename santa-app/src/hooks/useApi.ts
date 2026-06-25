import { useAuth } from "../contexts/useAuth";

export function useApi() {
  const { token, logout } = useAuth();

  const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${baseUrl}${url}`, {
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
  };

  return {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, body: unknown) =>
      request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  };
}
