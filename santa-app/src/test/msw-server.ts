import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const FAKE_USER = {
  id: "user-123",
  email: "alice@test.com",
  displayName: "Alice",
  role: "user",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const ROOM_1 = {
  id: "room-1",
  name: "Office Party",
  creatorId: "user-123",
  inviteCode: "VALID",
  participants: ["user-123", "user-456"],
  status: "pending" as const,
  drawDate: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const ROOM_2 = {
  id: "room-2",
  name: "Family Exchange",
  creatorId: "user-456",
  inviteCode: "FAM01",
  participants: ["user-456", "user-789", "user-abc", "user-def", "user-ghi"],
  status: "drawn" as const,
  drawDate: "2024-12-20T00:00:00.000Z",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

const WISHLIST_ITEMS = [
  { name: "Bicycle", url: "https://example.com/bike", priority: 1 },
  { name: "Book", priority: 2 },
];

export const server = setupServer(
  // --- Auth ---
  http.post("http://localhost:3001/auth/login", async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (email === "wrong@test.com") {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ accessToken: "fake-token" });
  }),

  http.post("http://localhost:3001/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      displayName: string;
    };
    if (body.email === "taken@test.com") {
      return HttpResponse.json(
        { message: "Email already taken" },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      {
        id: "new-user-id",
        email: body.email,
        displayName: body.displayName,
        accessToken: "new-fake-token",
      },
      { status: 201 },
    );
  }),

  http.get("http://localhost:3001/users/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json(FAKE_USER);
  }),

  // --- Rooms ---
  http.get("http://localhost:3001/rooms", () => {
    return HttpResponse.json({
      data: [ROOM_1, ROOM_2],
      meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
    });
  }),

  http.get("http://localhost:3001/rooms/:id", ({ params }) => {
    const { id } = params as { id: string };
    if (id === ROOM_1.id) return HttpResponse.json(ROOM_1);
    if (id === ROOM_2.id) return HttpResponse.json(ROOM_2);
    return HttpResponse.json({ message: "Room not found" }, { status: 404 });
  }),

  http.post("http://localhost:3001/rooms", async ({ request }) => {
    const body = (await request.json()) as { name: string; ownerId: string };
    return HttpResponse.json(
      { ...ROOM_1, id: "new-room-id", name: body.name },
      { status: 201 },
    );
  }),

  http.post(
    "http://localhost:3001/rooms/:code/join",
    async ({ params, request }) => {
      const { code } = params as { code: string };
      if (code !== "VALID") {
        return HttpResponse.json(
          { message: "Room not found" },
          { status: 404 },
        );
      }
      const body = (await request.json()) as { userId: string };
      return HttpResponse.json(
        { ...ROOM_1, participants: [...ROOM_1.participants, body.userId] },
        { status: 201 },
      );
    },
  ),

  // --- Wishlist ---
  http.get(
    "http://localhost:3001/rooms/:roomCode/wishlist/:userId",
    ({ params }) => {
      const { roomCode } = params as { roomCode: string };
      if (roomCode !== ROOM_1.inviteCode) {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }
      return HttpResponse.json({
        id: "wishlist-1",
        userId: "user-123",
        roomId: ROOM_1.id,
        items: WISHLIST_ITEMS,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
    },
  ),

  http.post(
    "http://localhost:3001/rooms/:roomCode/wishlist",
    async ({ params, request }) => {
      const body = (await request.json()) as {
        userId: string;
        items: unknown[];
      };
      return HttpResponse.json(
        {
          id: "wishlist-1",
          userId: body.userId,
          roomId: ROOM_1.id,
          items: body.items,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        { status: 201 },
      );
    },
  ),

  http.patch(
    "http://localhost:3001/rooms/:roomCode/wishlist/:userId",
    async ({ request }) => {
      const body = (await request.json()) as { items: unknown[] };
      return HttpResponse.json({
        id: "wishlist-1",
        userId: "user-123",
        roomId: ROOM_1.id,
        items: body.items,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
    },
  ),
);

export { FAKE_USER, ROOM_1, ROOM_2, WISHLIST_ITEMS };
