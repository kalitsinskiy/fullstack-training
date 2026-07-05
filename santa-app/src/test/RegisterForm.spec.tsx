import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw-server";
import { renderApp } from "./render-app";
import RegisterForm from "../components/RegisterForm";

describe("RegisterForm", () => {
  test("renders all fields", () => {
    renderApp(<RegisterForm />);
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  test("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test("shows confirm-password mismatch error (Zod refine)", async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await user.type(screen.getByLabelText(/display name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "SecretPass1");
    await user.type(screen.getByLabelText(/confirm password/i), "DifferentPass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test("shows 409 server error for taken email", async () => {
    server.use(
      http.post("http://localhost:3001/auth/register", () =>
        HttpResponse.json({ message: "Email already taken" }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await user.type(screen.getByLabelText(/display name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "taken@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "SecretPass1");
    await user.type(screen.getByLabelText(/confirm password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/email already taken/i);
  });

  test("stores token and populates user on successful registration", async () => {
    server.use(
      http.post("http://localhost:3001/auth/register", () =>
        HttpResponse.json(
          { id: "new-id", email: "new@test.com", displayName: "New", accessToken: "new-token" },
          { status: 201 },
        ),
      ),
      http.get("http://localhost:3001/users/me", () =>
        HttpResponse.json({ id: "new-id", email: "new@test.com", displayName: "New" }),
      ),
      http.get("http://localhost:3001/rooms", () =>
        HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await user.type(screen.getByLabelText(/display name/i), "New User");
    await user.type(screen.getByLabelText(/email/i), "new@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "SecretPass1");
    await user.type(screen.getByLabelText(/confirm password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("new-token");
    });
  });
});
