import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import { screen } from "@testing-library/react";
import { describe, test, expect, beforeEach } from "vitest";
import { renderApp } from "@/test/renderApp";
import { server } from "@/test/msw-server";
import RoomDetailPage from "./RoomDetailPage";

function detailRoutes() {
  return (
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailPage />} />
    </Routes>
  );
}

describe("RoomDetailPage", () => {
  beforeEach(() => {
    // The detail page renders the WishlistEditor, which needs an authenticated
    // user id — restore a session so AuthProvider populates `user`.
    localStorage.setItem("token", "fake-token");
  });

  test("fetches the room by id and renders its details", async () => {
    renderApp(detailRoutes(), { route: "/rooms/1" });

    expect(
      await screen.findByRole("heading", { name: "Office Party" }),
    ).toBeInTheDocument();
    // Room 1 has 3 participants and invite code OFFICE1.
    expect(screen.getByText(/OFFICE1/)).toBeInTheDocument();
    expect(screen.getByText(/3 participants/)).toBeInTheDocument();
  });

  test("renders the wishlist editor and the giftee's wishlist", async () => {
    renderApp(detailRoutes(), { route: "/rooms/1" });

    await screen.findByRole("heading", { name: "Office Party" });
    expect(
      await screen.findByRole("heading", { name: /^wishlist$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /giftee's wishlist/i }),
    ).toBeInTheDocument();
  });

  test("shows an error when the room is not found (404)", async () => {
    server.use(
      http.get("http://localhost:3001/rooms/:id", () =>
        HttpResponse.json({ message: "Room not found" }, { status: 404 }),
      ),
    );
    renderApp(detailRoutes(), { route: "/rooms/999" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /room not found/i,
    );
  });
});
