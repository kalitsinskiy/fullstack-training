import { Routes, Route } from "react-router";
import { screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { renderApp } from "@/test/renderApp";
import { ProtectedRoute } from "./ProtectedRoute";

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login screen</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  test("redirects to /login when unauthenticated", async () => {
    renderApp(routes(), { route: "/rooms" });

    expect(await screen.findByText("Login screen")).toBeInTheDocument();
    expect(screen.queryByText("Rooms screen")).not.toBeInTheDocument();
  });

  test("renders the protected children when authenticated", async () => {
    // A stored token makes AuthProvider restore the session via GET /users/me.
    localStorage.setItem("token", "fake-token");
    renderApp(routes(), { route: "/rooms" });

    expect(await screen.findByText("Rooms screen")).toBeInTheDocument();
    expect(screen.queryByText("Login screen")).not.toBeInTheDocument();
  });
});
