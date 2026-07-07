import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import { screen, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "vitest";
import { renderApp } from "@/test/renderApp";
import { server } from "@/test/msw-server";
import { WishlistPage } from "./WishlistPage";

const OWN_WISHLIST_URL = "http://localhost:3001/rooms/:roomId/wishlist/:userId";

let wishlistGets = 0;

function wishlistRoutes() {
  return (
    <Routes>
      <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
    </Routes>
  );
}

describe("WishlistPage", () => {
  beforeEach(() => {
    // The embedded WishlistEditor needs an authenticated user id.
    localStorage.setItem("token", "fake-token");
    wishlistGets = 0;
    server.use(
      http.get(OWN_WISHLIST_URL, () => {
        wishlistGets += 1;
        return HttpResponse.json({ message: "no wishlist yet" }, { status: 404 });
      }),
    );
  });

  test("renders the page heading and the wishlist editor for the room", async () => {
    renderApp(wishlistRoutes(), { route: "/rooms/1/wishlist" });

    expect(
      screen.getByRole("heading", { level: 1, name: /wishlist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to room/i }),
    ).toBeInTheDocument();

    // The editor mounts before auth resolves, so it flickers:
    // form (query disabled) → "Loading wishlist…" → form (query settled).
    // Wait for the terminal state: the wishlist fetch completed AND the form
    // (with its Save button) is showing.
    await waitFor(() => {
      expect(wishlistGets).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/loading wishlist/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^save$/i }),
      ).toBeInTheDocument();
    });
  });
});
