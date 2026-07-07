import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { renderApp } from "@/test/renderApp";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  test("renders email and password fields", () => {
    renderApp(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("shows Zod validation errors when submitting empty", async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test("logs in and calls onSuccess with valid credentials", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    // The login flow persisted the token returned by POST /auth/login.
    expect(localStorage.getItem("token")).toBe("fake-token");
  });

  test("shows the server error when the API rejects the login (401)", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<LoginForm onSuccess={onSuccess} />);

    // The default MSW handler returns 401 for this email.
    await user.type(screen.getByLabelText(/email/i), "wrong@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid credentials/i,
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
