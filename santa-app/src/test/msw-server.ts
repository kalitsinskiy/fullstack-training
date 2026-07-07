import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// The api service (src/services/api.ts) talks to this origin with NO `/api`
// prefix — endpoints are `/auth/login`, `/rooms`, `/users/me`, etc.
const BASE = "http://localhost:3001";

// ---- Fixtures (raw server shapes, before the app's map* helpers run) ----

export const ME = { _id: "u1", email: "alice@test.com", displayName: "Alice" };

export const RAW_ROOMS = [
  {
    _id: "1",
    name: "Office Party",
    inviteCode: "OFFICE1",
    participants: ["u1", "u2", "u3"],
    status: "pending" as const,
  },
  {
    _id: "2",
    name: "Family Exchange",
    inviteCode: "FAM22",
    participants: ["u1", "u2", "u3", "u4", "u5"],
    status: "drawn" as const,
  },
];

// ---- Default handlers (override per-test with server.use(...)) ----

export const handlers = [
  // Auth ------------------------------------------------------------------
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (email === "wrong@test.com") {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ accessToken: "fake-token" });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const { email, displayName } = (await request.json()) as {
      email: string;
      displayName: string;
    };
    if (email === "taken@test.com") {
      return HttpResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { id: "new-user", email, displayName, accessToken: "fake-token" },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/users/me`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json(ME);
  }),

  // Rooms -----------------------------------------------------------------
  http.get(`${BASE}/rooms`, () => HttpResponse.json({ data: RAW_ROOMS })),

  http.get(`${BASE}/rooms/:id`, ({ params }) => {
    const room = RAW_ROOMS.find((r) => r._id === params.id);
    if (!room) {
      return HttpResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return HttpResponse.json(room);
  }),

  http.post(`${BASE}/rooms`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(
      {
        _id: "generated-id",
        name: body.name,
        inviteCode: "NEWCODE",
        participants: ["u1"],
        status: "pending",
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/rooms/:code/join`, ({ params }) =>
    HttpResponse.json({
      _id: "1",
      name: "Office Party",
      inviteCode: String(params.code),
      participants: ["u1", "u2", "u3", "u4"],
      status: "pending",
    }),
  ),

  // Wishlist --------------------------------------------------------------
  // Own wishlist is fetched at `/rooms/:roomId/wishlist/:userId`; a 404 is
  // treated by the editor as "empty wishlist".
  http.get(`${BASE}/rooms/:roomId/wishlist/:userId`, () =>
    HttpResponse.json({ message: "No wishlist yet" }, { status: 404 }),
  ),

  http.post(`${BASE}/rooms/:roomId/wishlist`, async ({ request }) => {
    const body = (await request.json()) as { items: unknown[] };
    return HttpResponse.json(body);
  }),
];

export const server = setupServer(...handlers);
