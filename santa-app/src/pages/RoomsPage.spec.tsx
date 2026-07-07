import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { renderApp } from "@/test/renderApp";
import { server, RAW_ROOMS } from "@/test/msw-server";
import { RoomsPage } from "./RoomsPage";

const ROOMS_URL = "http://localhost:3001/rooms";

describe("RoomsPage", () => {
  test("shows a loading state before the rooms resolve", () => {
    renderApp(<RoomsPage />, { route: "/rooms" });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders the fetched room list", async () => {
    renderApp(<RoomsPage />, { route: "/rooms" });

    expect(await screen.findByText("Office Party")).toBeInTheDocument();
    expect(screen.getByText("Family Exchange")).toBeInTheDocument();
  });

  test("shows the empty state when there are no rooms", async () => {
    server.use(
      http.get(ROOMS_URL, () => HttpResponse.json({ data: [] })),
    );
    renderApp(<RoomsPage />, { route: "/rooms" });

    expect(
      await screen.findByText(/no rooms yet/i),
    ).toBeInTheDocument();
  });

  test("shows an error state when the request fails", async () => {
    server.use(
      http.get(ROOMS_URL, () =>
        HttpResponse.json({ message: "Server exploded" }, { status: 500 }),
      ),
    );
    renderApp(<RoomsPage />, { route: "/rooms" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /server exploded/i,
    );
  });

  test("joining a room fires POST /rooms/:code/join and invalidates the list", async () => {
    const user = userEvent.setup();
    let joinCalled = false;
    let listFetches = 0;
    server.use(
      http.get(ROOMS_URL, () => {
        listFetches += 1;
        return HttpResponse.json({ data: RAW_ROOMS });
      }),
      http.post("http://localhost:3001/rooms/:code/join", ({ params }) => {
        joinCalled = true;
        return HttpResponse.json({
          _id: "1",
          name: "Office Party",
          inviteCode: String(params.code),
          participants: ["u1", "u2", "u3", "u4"],
          status: "pending",
        });
      }),
    );

    renderApp(<RoomsPage />, { route: "/rooms" });

    // "Office Party" is the only open room, so it's the one with a Join button.
    await screen.findByText("Office Party");
    expect(listFetches).toBe(1);

    await user.click(screen.getByRole("button", { name: /join/i }));

    // The mutation invalidates ['rooms'], so the list query refetches.
    await waitFor(() => expect(joinCalled).toBe(true));
    await waitFor(() => expect(listFetches).toBeGreaterThanOrEqual(2));
  });
});
