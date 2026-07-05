import { screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import { server } from "./msw-server";
import { renderApp } from "./render-app";
import { ProtectedRoute } from "../components/ProtectedRoute";

describe("ProtectedRoute", () => {
  test("redirects unauthenticated user to /login", async () => {
    renderApp(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/rooms" element={<div>Rooms screen</div>} />
        </Route>
      </Routes>,
      { route: "/rooms" },
    );

    expect(await screen.findByText("Login screen")).toBeInTheDocument();
    expect(screen.queryByText("Rooms screen")).not.toBeInTheDocument();
  });

  test("renders children when authenticated", async () => {
    localStorage.setItem("token", "fake-token");
    server.use(
      http.get("http://localhost:3001/users/me", () =>
        HttpResponse.json({ id: "user-123", email: "alice@test.com", displayName: "Alice" }),
      ),
    );

    renderApp(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/rooms" element={<div>Rooms screen</div>} />
        </Route>
      </Routes>,
      { route: "/rooms" },
    );

    expect(await screen.findByText("Rooms screen")).toBeInTheDocument();
    expect(screen.queryByText("Login screen")).not.toBeInTheDocument();
  });
});
