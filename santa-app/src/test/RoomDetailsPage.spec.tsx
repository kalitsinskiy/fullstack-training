import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import { server, FAKE_USER, ROOM_1 } from "./msw-server";
import { renderApp } from "./render-app";
import RoomDetailsPage from "../components/RoomDetailsPage";

function renderRoom(roomId = ROOM_1.id) {
  localStorage.setItem("token", "fake-token");
  server.use(
    http.get("http://localhost:3001/users/me", () => HttpResponse.json(FAKE_USER)),
  );
  return renderApp(
    <Routes>
      <Route path="/rooms/:id" element={<RoomDetailsPage />} />
    </Routes>,
    { route: `/rooms/${roomId}` },
  );
}

describe("RoomDetailsPage", () => {
  test("fetches room by id and renders its name and inviteCode", async () => {
    renderRoom();
    expect(await screen.findByText("Office Party")).toBeInTheDocument();
    expect(screen.getByText(/VALID/)).toBeInTheDocument();
  });

  test("renders participant count", async () => {
    renderRoom();
    await screen.findByText("Office Party");
    expect(screen.getByText(String(ROOM_1.participants.length))).toBeInTheDocument();
  });

  test("renders status badge", async () => {
    renderRoom();
    await screen.findByText("Office Party");
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  test("shows Join button for pending room", async () => {
    renderRoom();
    expect(await screen.findByRole("button", { name: /join this room/i })).toBeInTheDocument();
  });

  test("Join button fires POST /rooms/:inviteCode/join and shows success", async () => {
    renderRoom();
    await screen.findByRole("button", { name: /join this room/i });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /join this room/i }));

    expect(await screen.findByText(/joined successfully/i)).toBeInTheDocument();
  });

  test("shows error state when room not found", async () => {
    server.use(
      http.get("http://localhost:3001/rooms/:id", () =>
        HttpResponse.json({ message: "Room not found" }, { status: 404 }),
      ),
    );
    renderRoom("nonexistent");
    expect(await screen.findByText(/could not load room/i)).toBeInTheDocument();
  });

  test("Join button shows success and then shows no Join button (joined state)", async () => {
    renderRoom();
    await screen.findByRole("button", { name: /join this room/i });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /join this room/i }));

    await screen.findByText(/joined successfully/i);
    expect(screen.queryByRole("button", { name: /join this room/i })).not.toBeInTheDocument();
  });
});
