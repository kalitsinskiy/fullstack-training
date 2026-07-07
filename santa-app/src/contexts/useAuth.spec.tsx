import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

/** A wrapper mirroring the real provider tree, exposing the client to spy on. */
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe("useAuth", () => {
  test("starts unauthenticated when there is no stored token", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  test("login stores the token and populates the user via GET /users/me", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("alice@test.com", "SecretPass1");
    });

    expect(result.current.token).toBe("fake-token");
    expect(result.current.isAuthenticated).toBe(true);
    // GET /users/me returns the raw `_id`; AuthContext maps it to `id`.
    expect(result.current.user).toMatchObject({
      id: "u1",
      displayName: "Alice",
    });
    expect(localStorage.getItem("token")).toBe("fake-token");
  });

  test("logout clears the token, the user, and the query cache", async () => {
    const { wrapper, queryClient } = makeWrapper();
    const clearSpy = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("alice@test.com", "SecretPass1");
    });
    // Seed a cached query belonging to the logged-in user.
    queryClient.setQueryData(["rooms"], [{ id: "1" }]);

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
    expect(queryClient.getQueryData(["rooms"])).toBeUndefined();
  });
});
