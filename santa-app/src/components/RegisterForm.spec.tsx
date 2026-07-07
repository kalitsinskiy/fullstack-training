import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { renderApp } from "@/test/renderApp";
import { RegisterForm } from "./RegisterForm";

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  {
    name = "Alice",
    email = "alice@test.com",
    password = "SecretPass1",
    confirm = "SecretPass1",
  }: Partial<{
    name: string;
    email: string;
    password: string;
    confirm: string;
  }> = {},
) {
  await user.type(screen.getByLabelText(/^name$/i), name);
  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

describe("RegisterForm", () => {
  test("shows Zod validation errors for every field when submitting empty", async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/at least 2 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test("shows a Zod refine error when the passwords do not match", async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await fillForm(user, { password: "SecretPass1", confirm: "Different99" });
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  test("registers and calls onSuccess on the happy path", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(localStorage.getItem("token")).toBe("fake-token");
  });

  test("renders the server error when the email is already taken (409)", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    // The default MSW handler returns 409 for this email.
    await fillForm(user, { email: "taken@test.com" });
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /already registered/i,
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
