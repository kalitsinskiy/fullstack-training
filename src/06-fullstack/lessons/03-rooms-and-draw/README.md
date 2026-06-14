# Lesson 03: Rooms & Draw

## Quick Overview

The heart of Secret Santa is the **draw** -- randomly assigning each participant to another participant such that nobody draws themselves. This is a classic computer science problem called a **derangement** (a permutation with no fixed points).

Beyond the algorithm, the draw must be **atomic**: either all assignments are saved to the database, or none are. If the server crashes mid-save, you should not end up with half the participants assigned and half not. A single-document update gives you this guarantee for free: store the assignments **inside the Room document** and save them in one write — a single-document write in MongoDB is atomic, with no transaction or replica set needed.

By the end of this lesson you will have:

- An `assignments` array on the Room schema
- A draw endpoint that uses a derangement algorithm
- Atomic saving of all assignments via a single-document update (no transaction needed)
- Frontend UI for triggering the draw and viewing your assignment

---

> **Build the UI from the mockup.** This lesson's frontend lives on the
> **Room detail** screen — Figma frames [mobile](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=33-2) ·
> [desktop](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=43-2) (see [`santa-app/docs/mockups/`](../00-kickoff/template/santa-app/docs/mockups/)).
> Flesh out the `RoomDetailPage` stub (`santa-app/src/pages/RoomDetailPage.tsx`),
> following the `LoginPage` worked example and the tokens in `docs/design-system.md`.

## Key Concepts

### 1. The Derangement Problem

A **derangement** is a permutation of elements where no element appears in its original position. In Secret Santa terms: if you have participants [A, B, C, D], a derangement might be [B, D, A, C] -- meaning A gives to B, B gives to D, C gives to A, D gives to C. Nobody gives to themselves.

Not every random shuffle is a derangement. For example, [B, A, C, D] is not a derangement because C is still in position 3 and D is still in position 4.

The probability that a random permutation of n elements is a derangement approaches `1/e` (about 36.8%) as n grows. So if you just shuffle randomly and check, you will reject about 63% of shuffles. For small groups this is fine, but there is a better approach.

### 2. Sattolo's Algorithm

**Sattolo's algorithm** generates a random cyclic permutation -- a permutation that consists of exactly one cycle containing all elements. Every cyclic permutation is also a derangement (no element maps to itself), because in a single cycle every element must move to a different position.

```typescript
function sattoloCycle<T>(arr: T[]): T[] {
  const result = [...arr];
  let i = result.length;

  while (i > 1) {
    i--;
    // Pick j from 0 to i-1 (exclusive of i!)
    const j = Math.floor(Math.random() * i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
```

The key difference from the Fisher-Yates shuffle is that `j` is picked from `[0, i-1]` instead of `[0, i]`. This small change guarantees that no element stays in place.

**Example:**

```typescript
const participants = ['Alice', 'Bob', 'Charlie', 'Diana'];
const shuffled = sattoloCycle(participants);
// shuffled might be ['Charlie', 'Diana', 'Bob', 'Alice']

// Pair each participant with their shuffled counterpart:
// Alice   -> Charlie
// Bob     -> Diana
// Charlie -> Bob
// Diana   -> Alice
```

### 3. Fisher-Yates with Rejection

An alternative approach: use the standard Fisher-Yates shuffle and reject the result if any element is in its original position.

```typescript
function derangement<T>(arr: T[]): T[] {
  let result: T[];

  do {
    result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  } while (result.some((val, idx) => val === arr[idx]));

  return result;
}
```

This is simpler to understand but has no guaranteed termination time (though in practice it terminates quickly -- on average less than 2 attempts).

### 4. Generating Assignments

Once you have a derangement, pair each participant with their assigned recipient:

```typescript
interface Assignment {
  giverId: string;   // ObjectId of the giver
  receiverId: string; // ObjectId of the receiver
  roomId: string;     // ObjectId of the room
}

function generateAssignments(participantIds: string[], roomId: string): Assignment[] {
  const shuffled = sattoloCycle(participantIds);

  return participantIds.map((giverId, index) => ({
    giverId,
    receiverId: shuffled[index],
    roomId,
  }));
}
```

### 5. Atomicity — the simple way (single-document write)

The draw must be all-or-nothing. The simplest way to get that: store the
assignments **as an array on the Room document** and write them with one
`findByIdAndUpdate` (set `status` and `assignments` in the same call). A
single-document update in MongoDB is **atomic by definition** — no transaction,
no replica set needed. This is what the reference does:

```typescript
await this.roomModel.findByIdAndUpdate(
  roomId,
  { status: 'drawn', drawDate: new Date(), assignments },
  { new: true },
);
```

> **Why single-document and not a transaction?** We deliberately keep all
> assignments on the Room document so one atomic write covers the whole draw.
> That avoids multi-document transactions entirely — no `startSession`, no
> `withTransaction`, and **no replica set** to run locally. Keep the data on one
> document and you never need them for this app.

### 6. Error Handling and Idempotency

The draw endpoint should be **idempotent** in the sense that it cannot be run twice. Once a room is in "drawn" status, subsequent draw requests should return an error (or return the existing assignments). This prevents duplicate assignments.

```typescript
// Check preconditions before drawing
const room = await Room.findById(roomId);

if (room.status === 'drawn') {
  throw new BadRequestException('Draw has already been performed');
}

if (room.participants.length < 3) {
  throw new BadRequestException('Need at least 3 participants to draw');
}

if (room.createdBy.toString() !== userId) {
  throw new ForbiddenException('Only the room creator can trigger the draw');
}
```

---

## Task

### Step 1: Add assignments to the Room schema

In **santa-api**, store the draw result **on the Room document** — an
`assignments` array of `{ giverId, receiverId }` pairs (both `ObjectId`, ref
`User`), plus a `status` field and an optional `drawDate`. Writing the whole
array in one update keeps the draw atomic without a separate collection or a
transaction.

```typescript
// Room schema additions:
// - status:      'pending' | 'drawn'  (default 'pending')
// - drawDate?:   Date
// - assignments: [{ giverId: ObjectId<User>, receiverId: ObjectId<User> }]
```

### Step 2: Implement the derangement algorithm

Create a utility function (e.g., `src/utils/derangement.ts` or inside the assignment service) that takes an array of participant IDs and returns a derangement.

Choose either Sattolo's algorithm or Fisher-Yates with rejection. Make sure:
- The function works for arrays of 3 or more elements.
- No participant is paired with themselves.
- The result is random (different each time).

Write a quick sanity check: call the function 1000 times and verify no element is ever in its original position.

### Step 3: Implement POST /rooms/:id/draw

Create the draw endpoint in your rooms or assignments controller:

1. **Authorization**: Only the room creator can trigger the draw. Use your existing auth guard.
2. **Validation**:
   - Room must exist
   - Room must have at least 3 participants
   - Room status must not be "drawn" already
3. **Generate assignments** using the derangement function.
4. **Save atomically** with one `findByIdAndUpdate` — set `status: 'drawn'`,
   `drawDate`, and the `assignments` array in the same call. A single-document
   write is atomic, so there is nothing to roll back.
5. **Return** the updated room (or just a success message).

Make sure your Room schema has a `status` field (`'pending' | 'drawn'`, default `'pending'`).

### Step 4: Implement GET /rooms/:id/assignment

Create an endpoint where an authenticated user can see their own assignment:

1. Find the assignment where `roomId` matches and `giverId` matches the authenticated user.
2. Populate the receiver's basic info (name, maybe avatar) and their wishlist.
3. Return only the current user's assignment -- never expose who is giving to whom for other participants.

```typescript
// Response shape (matches santa-api/docs/api-contract.md):
{
  "receiver": {
    "id": "...",
    "displayName": "Alice",
    "wishlist": ["Book XYZ", "Wool socks", "Coffee beans"]
  }
}
```

> **Wishlist is `string[]`** per the API contract and `santa-app/src/types/api.ts`.
> Keep it simple — one string per item.

### Step 5: Update the frontend

In **santa-app**, on the room detail page:

1. **Draw button**: Show a "Draw Names" button that is only visible to the room creator. Disable it if:
   - The room has fewer than 3 participants
   - The draw has already happened (room status is "drawn")

2. **Trigger the draw**: When clicked, call `POST /api/rooms/:id/draw`. Show a loading state while the request is in flight.

3. **Show assignment**: After the draw, call `GET /api/rooms/:id/assignment` and display the result:
   - "You are giving a gift to: **Alice**"
   - Show Alice's wishlist items

4. **Handle errors**: Show user-friendly messages for cases like "not enough participants" or "draw already performed."

### Step 6: Verify the draw is atomic

No replica set needed — the single `findByIdAndUpdate` is atomic on a standalone
MongoDB. Sanity-check: trigger the draw, confirm `status` flips to `drawn` and
every participant has exactly one assignment (and nobody draws themselves);
trigger it again and confirm it is rejected (already drawn).

---

## Verification

```bash
# 1. Start the stack
docker-compose up --build

# 2. Register two users and create a room (you should have these from earlier lessons)
# Register users (adjust to your API)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@test.com", "password": "password123"}'

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": "bob@test.com", "password": "password123"}'

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Charlie", "email": "charlie@test.com", "password": "password123"}'

# 3. Login as Alice and create a room
TOKEN_ALICE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@test.com", "password": "password123"}' | jq -r '.accessToken')

ROOM_ID=$(curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -d '{"name": "Office Party"}' | jq -r '._id')

# 4. Have Bob and Charlie join the room
# (use your invite/join flow)

# 5. Try to draw with less than 3 participants (should fail)
curl -X POST "http://localhost:3001/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: 400 "Need at least 3 participants"

# 6. After all three have joined, trigger the draw
curl -X POST "http://localhost:3001/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: 201 with assignments

# 7. Try to draw again (should fail)
curl -X POST "http://localhost:3001/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: 400 "Draw has already been performed"

# 8. Get Alice's assignment
curl "http://localhost:3001/rooms/$ROOM_ID/assignment" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: { "receiver": { "name": "Bob" or "Charlie", ... } }

# 9. Verify Bob cannot trigger a draw (he's not the creator)
TOKEN_BOB=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@test.com", "password": "password123"}' | jq -r '.accessToken')

curl -X POST "http://localhost:3001/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_BOB"
# Expected: 403 Forbidden
```
