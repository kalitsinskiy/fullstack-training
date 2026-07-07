import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { renderApp } from "@/test/renderApp";
import App from "./App";

describe("App (integration)", () => {
  test("redirects an unauthenticated user from a protected route to /login", async () => {
    renderApp(<App />, { route: "/rooms" });

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("logging in lands the user on the rooms page", async () => {
    const user = userEvent.setup();
    renderApp(<App />, { route: "/rooms" });

    await user.type(await screen.findByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/password/i), "SecretPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // After login the ProtectedRoute lets us through and RoomsPage renders.
    expect(await screen.findByText("Office Party")).toBeInTheDocument();
  });

  test("shows the 404 page for an unknown route", async () => {
    renderApp(<App />, { route: "/nope/not/here" });

    expect(await screen.findByText("404")).toBeInTheDocument();
  });

  test("creates a room from the header dialog", async () => {
    localStorage.setItem("token", "fake-token");
    const user = userEvent.setup();
    renderApp(<App />, { route: "/rooms" });

    await screen.findByText("Office Party");
    await user.click(screen.getByRole("button", { name: /create room/i }));

    await user.type(
      await screen.findByLabelText(/room name/i),
      "Holiday Party",
    );
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    // On success the dialog closes.
    await waitFor(() =>
      expect(screen.queryByLabelText(/room name/i)).not.toBeInTheDocument(),
    );
  });

  test("logging out returns to /login", async () => {
    localStorage.setItem("token", "fake-token");
    const user = userEvent.setup();
    renderApp(<App />, { route: "/rooms" });

    await screen.findByText("Office Party");
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });
});
