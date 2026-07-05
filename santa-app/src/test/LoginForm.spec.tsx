import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw-server";
import { renderApp } from "./render-app";
import LoginForm from "../components/LoginForm";

describe("LoginForm", () => {
  test("renders email and password fields", () => {
    renderApp(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("shows Zod validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least \d+ characters/i)).toBeInTheDocument();
  });

  test("shows Zod error for invalid email format", async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.tab();

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  test("shows server error on 401 response", async () => {
    server.use(
      http.post("http://localhost:3001/auth/login", () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "wrong@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid credentials/i,
    );
  });

  test("calls auth.login and navigates on valid submit", async () => {
    server.use(
      http.post("http://localhost:3001/auth/login", () =>
        HttpResponse.json({ accessToken: "fake-token" }),
      ),
      http.get("http://localhost:3001/users/me", () =>
        HttpResponse.json({
          id: "user-123",
          email: "alice@test.com",
          displayName: "Alice",
        }),
      ),
      http.get("http://localhost:3001/rooms", () =>
        HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
        }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });
});
