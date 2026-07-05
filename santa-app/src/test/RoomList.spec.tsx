import { screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server, FAKE_USER } from "./msw-server";
import { renderApp } from "./render-app";
import RoomList from "../components/RoomList";

function renderAuthenticated(ui: React.ReactElement) {
  localStorage.setItem("token", "fake-token");
  server.use(
    http.get("http://localhost:3001/users/me", () => HttpResponse.json(FAKE_USER)),
  );
  return renderApp(ui);
}

describe("RoomList", () => {
  test("shows loading state initially", () => {
    renderAuthenticated(<RoomList />);
    expect(screen.getByText(/loading rooms/i)).toBeInTheDocument();
  });

  test("renders fetched rooms via TanStack Query + MSW", async () => {
    renderAuthenticated(<RoomList />);
    expect(await screen.findByText("Office Party")).toBeInTheDocument();
    expect(screen.getByText("Family Exchange")).toBeInTheDocument();
  });

  test("shows empty state when no rooms returned", async () => {
    server.use(
      http.get("http://localhost:3001/rooms", () =>
        HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
      ),
    );
    renderAuthenticated(<RoomList />);
    expect(await screen.findByText(/no rooms found yet/i)).toBeInTheDocument();
  });

  test("shows error state on API failure", async () => {
    server.use(
      http.get("http://localhost:3001/rooms", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );
    renderAuthenticated(<RoomList />);
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });
});
