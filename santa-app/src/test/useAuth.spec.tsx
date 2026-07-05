import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server, FAKE_USER } from "./msw-server";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "../hooks/useAuth";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("useAuth", () => {
  test("starts unauthenticated when no stored token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("restores session from stored token on mount", async () => {
    localStorage.setItem("token", "fake-token");
    server.use(
      http.get("http://localhost:3001/users/me", () => HttpResponse.json(FAKE_USER)),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(FAKE_USER.email);
  });

  test("clears token if /users/me 401s during session restore", async () => {
    localStorage.setItem("token", "expired-token");
    server.use(
      http.get("http://localhost:3001/users/me", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("login stores token and calls GET /users/me to populate user", async () => {
    server.use(
      http.post("http://localhost:3001/auth/login", () =>
        HttpResponse.json({ accessToken: "fake-token" }),
      ),
      http.get("http://localhost:3001/users/me", () => HttpResponse.json(FAKE_USER)),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("alice@test.com", "SecretPass1");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe(FAKE_USER.id);
    expect(localStorage.getItem("token")).toBe("fake-token");
  });

  test("logout clears token and user", async () => {
    localStorage.setItem("token", "fake-token");
    server.use(
      http.get("http://localhost:3001/users/me", () => HttpResponse.json(FAKE_USER)),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
