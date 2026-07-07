import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach } from "vitest";
import { renderApp } from "@/test/renderApp";
import { server } from "@/test/msw-server";
import { WishlistEditor } from "./WishlistEditor";

const WISHLIST_URL = "http://localhost:3001/rooms/1/wishlist";
const OWN_WISHLIST_URL = "http://localhost:3001/rooms/:roomId/wishlist/:userId";

let wishlistGets = 0;

beforeEach(() => {
  // The editor reads the current user's id (from GET /users/me) to fetch the
  // wishlist, so a session must be restored first.
  localStorage.setItem("token", "fake-token");
  wishlistGets = 0;
  server.use(
    http.get(OWN_WISHLIST_URL, () => {
      wishlistGets += 1;
      return HttpResponse.json({ message: "no wishlist yet" }, { status: 404 });
    }),
  );
});

/**
 * Renders the editor and waits past the transient states: the form first
 * renders while auth is still loading (no user id → query disabled), then
 * flips to "Loading wishlist…" once the query enables, then settles back to
 * the form. Interacting before it settles loses input (RHF `values` resets).
 */
async function renderSettledEditor() {
  const user = userEvent.setup();
  renderApp(<WishlistEditor roomId="1" />);
  await waitFor(() => {
    expect(wishlistGets).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/loading wishlist/i)).not.toBeInTheDocument();
  });
  return user;
}

describe("WishlistEditor", () => {
  test("adds a new item row", async () => {
    const user = await renderSettledEditor();
    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /add item/i }));

    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(2);
  });

  test("removes an item row", async () => {
    const user = await renderSettledEditor();
    // Add a second row so removal is allowed (the last row can't be removed).
    await user.click(screen.getByRole("button", { name: /add item/i }));
    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(2);

    const removeButtons = screen.getAllByRole("button", { name: /^remove$/i });
    await user.click(removeButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(1),
    );
  });

  test("edits an item's name", async () => {
    const user = await renderSettledEditor();
    const [name] = screen.getAllByLabelText(/^name$/i);

    await user.type(name, "Wireless headphones");

    expect(screen.getByDisplayValue("Wireless headphones")).toBeInTheDocument();
  });

  test("submitting fires POST /rooms/:id/wishlist with the items", async () => {
    let captured: { items: { name: string }[] } | undefined;
    server.use(
      http.post(WISHLIST_URL, async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json(captured);
      }),
    );

    const user = await renderSettledEditor();
    const [name] = screen.getAllByLabelText(/^name$/i);
    await user.type(name, "Board game");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(captured).toBeDefined());
    expect(captured?.items).toHaveLength(1);
    expect(captured?.items[0].name).toBe("Board game");
  });

  test("shows a per-row Zod error when a name is empty", async () => {
    let saveCalled = false;
    server.use(
      http.post(WISHLIST_URL, () => {
        saveCalled = true;
        return HttpResponse.json({ items: [] });
      }),
    );

    const user = await renderSettledEditor();
    // Leave the name empty and submit.
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(saveCalled).toBe(false);
  });
});
