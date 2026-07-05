import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import { server, FAKE_USER, ROOM_1, WISHLIST_ITEMS } from "./msw-server";
import { renderApp } from "./render-app";
import WishlistPage from "../components/WishlistPage";

function renderWishlist(roomId = ROOM_1.id) {
  localStorage.setItem("token", "fake-token");
  server.use(
    http.get("http://localhost:3001/users/me", () =>
      HttpResponse.json(FAKE_USER),
    ),
  );
  return renderApp(
    <Routes>
      <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
    </Routes>,
    { route: `/rooms/${roomId}/wishlist` },
  );
}

describe("WishlistPage", () => {
  // Suppress unhandled rejection noise from mutateAsync after component unmounts
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());
  test("loads and displays existing wishlist items", async () => {
    renderWishlist();
    expect(await screen.findByDisplayValue("Bicycle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Book")).toBeInTheDocument();
  });

  test("can add a new item row", async () => {
    renderWishlist();
    await screen.findByDisplayValue("Bicycle");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add item/i }));

    const nameInputs = screen.getAllByPlaceholderText("Gift idea");
    expect(nameInputs).toHaveLength(WISHLIST_ITEMS.length + 1);
  });

  test("shows Zod validation error for empty item name on submit", async () => {
    server.use(
      http.get("http://localhost:3001/rooms/VALID/wishlist/user-123", () =>
        HttpResponse.json({
          id: "wishlist-1",
          userId: "user-123",
          roomId: ROOM_1.id,
          items: [{ name: "" }],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      ),
    );
    renderWishlist();
    await screen.findByRole("button", { name: /save wishlist/i });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save wishlist/i }),
      ).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save wishlist/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  test("save fires POST /rooms/:roomCode/wishlist and shows success", async () => {
    let savedItems: unknown[] | null = null;
    server.use(
      http.post(
        "http://localhost:3001/rooms/:roomCode/wishlist",
        async ({ request }) => {
          const body = (await request.json()) as { items: unknown[] };
          savedItems = body.items;
          return HttpResponse.json(
            {
              id: "wishlist-1",
              userId: "user-123",
              roomId: ROOM_1.id,
              items: body.items,
              createdAt: "",
              updatedAt: "",
            },
            { status: 201 },
          );
        },
      ),
    );

    renderWishlist();
    await screen.findByDisplayValue("Bicycle");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save wishlist/i }),
      ).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save wishlist/i }));

    await waitFor(() => expect(savedItems).not.toBeNull());
    expect(await screen.findByRole("status")).toHaveTextContent(
      /wishlist saved/i,
    );
  });

  test("remove button optimistically removes item from DOM", async () => {
    renderWishlist();
    await screen.findByDisplayValue("Bicycle");

    // Override GET to return filtered list for the re-fetch after onSettled
    server.use(
      http.get("http://localhost:3001/rooms/VALID/wishlist/user-123", () =>
        HttpResponse.json({
          id: "wishlist-1",
          userId: "user-123",
          roomId: ROOM_1.id,
          items: [{ name: "Book", priority: 2 }],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      ),
    );

    const user = userEvent.setup();
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);

    // onMutate calls remove(idx) — item disappears from DOM
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Bicycle")).not.toBeInTheDocument();
    });
  });

  test("shows server error when save fails", async () => {
    server.use(
      http.post("http://localhost:3001/rooms/:roomCode/wishlist", () =>
        HttpResponse.json(
          { message: "Failed to save wishlist" },
          { status: 500 },
        ),
      ),
    );

    renderWishlist();
    await screen.findByDisplayValue("Bicycle");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save wishlist/i }),
      ).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save wishlist/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to save/i,
    );
  });

  test("shows empty form when no wishlist exists (404)", async () => {
    server.use(
      http.get("http://localhost:3001/rooms/VALID/wishlist/user-123", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    );

    renderWishlist();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save wishlist/i }),
      ).not.toBeDisabled();
    });

    const nameInputs = screen.getAllByPlaceholderText("Gift idea");
    expect(nameInputs).toHaveLength(1);
  });
});
