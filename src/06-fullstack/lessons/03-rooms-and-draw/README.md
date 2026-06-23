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
> **Room detail** screen — see the local mockups in [`design/screens/`](../00-kickoff/template/santa-app/design/screens/).
> Flesh out the `RoomDetailPage` stub (`santa-app/src/pages/RoomDetailPage.tsx`),
> following the `LoginPage` worked example and the tokens in `santa-app/design/design-system.md`.

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

if (room.creatorId.toString() !== userId) {
  throw new ForbiddenException('Only the room creator can trigger the draw');
}
```

---

## Task

### Step 1: Confirm the Room schema stores the draw result

The draw result lives **on the Room document** — an `assignments` array of
`{ giverId, receiverId }` pairs (both `ObjectId`, ref `User`), plus a `status`
field and an optional `drawDate`. Writing the whole array in one update keeps the
draw atomic without a separate collection or a transaction.

The template's `rooms/schemas/room.schema.ts` **already includes these** (they're
part of the provided structure) — open it and confirm:

```typescript
// Room schema (already present):
// - status:      'pending' | 'drawn'  (default 'pending')
// - drawDate?:   Date
// - assignments: [{ giverId: ObjectId<User>, receiverId: ObjectId<User> }]
```

> If you built your own schema instead of using the template, add these fields now.

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
   `drawDate`, `exchangeDate`, and the `assignments` array in the same call. A
   single-document write is atomic, so there is nothing to roll back.
5. **Return** the updated room (or just a success message).

Make sure your Room schema has a `status` field (`'pending' | 'drawn'`, default `'pending'`).

> **The draw sets the gift-exchange date.** The request body carries a **required**
> `exchangeDate` (ISO 8601) — `{ "exchangeDate": "2026-12-24" }` (see the API
> contract). Picking it at draw time means everyone learns the day the moment
> names are drawn. Store it on the room as `exchangeDate` and reject the draw
> (`400`) if it's missing/invalid. It stays editable afterwards via
> `PATCH /rooms/:id` (owner only).
>
> **Gift budget** is set earlier, when the room is **created**: optional `budget`
> (number) + `currency` (`$ € £ ₴ zł`), stored on the room and shown to everyone.

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

2. **Trigger the draw**: Clicking "Draw Names" opens a **dialog with a calendar**
   (date picker) where the owner picks the **gift-exchange date** — the draw button
   in the dialog stays disabled until a date is chosen. Confirming calls
   `POST /api/rooms/:id/draw` with `{ exchangeDate }`. Show a loading state while
   the request is in flight. After the draw, display the exchange date to **all**
   participants on the room page, and let the owner change it (`PATCH /rooms/:id`).

3. **Show assignment**: After the draw, call `GET /api/rooms/:id/assignment` and display the result:
   - "You are giving a gift to: **Alice**"
   - Show Alice's wishlist items

4. **Handle errors**: Show user-friendly messages for cases like "not enough participants" or "draw already performed."

#### Building the calendar

The date picker is [`react-day-picker`](https://daypicker.dev) (`npm i
react-day-picker date-fns`). How it should look and behave (see the
`room-draw-dialog.png` mockup and `design/design-system.md`):

- **Render it inline inside the Dialog — NOT wrapped in a Popover.** A
  popover-wrapped day-picker dismisses on the day/nav clicks, so dates won't
  select and the month arrows close it. The Dialog is already the surface.
- `mode="single"`, controlled via `selected` / `onSelect`; `weekStartsOn={1}`
  (Monday); `disabled={{ before: today }}` so past days can't be chosen.
- **Theme it to the palette** — by default react-day-picker is blue. Override its
  `.rdp-root` CSS vars with a higher-specificity wrapper class (e.g. `.santa-cal`):
  `--rdp-accent-color: hsl(var(--primary))`, today/​chevrons in `--primary`,
  selected day = primary fill + `--primary-foreground` text, and
  `font-family: inherit` (its default font isn't the app's). Import
  `react-day-picker/style.css` once.
- Show the chosen date as a readout (`date-fns` `format(d, 'EEE, d MMM yyyy')`) and
  keep the confirm button disabled until a date is picked. Reuse the same inline
  `Calendar` in a small Dialog for the owner's "Change date" action.

### Step 6: Verify the draw is atomic

No replica set needed — the single `findByIdAndUpdate` is atomic on a standalone
MongoDB. Sanity-check: trigger the draw, confirm `status` flips to `drawn` and
every participant has exactly one assignment (and nobody draws themselves);
trigger it again and confirm it is rejected (already drawn).

---

## Verification

```bash
# 1. Start the stack
docker compose up --build

# API base is /api; registration takes { email, password, displayName }.
# 2. Register three users
curl -s -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" \
  -d '{"displayName": "Alice", "email": "alice@test.com", "password": "Passw0rd!"}'
curl -s -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" \
  -d '{"displayName": "Bob", "email": "bob@test.com", "password": "Passw0rd!"}'
curl -s -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" \
  -d '{"displayName": "Charlie", "email": "charlie@test.com", "password": "Passw0rd!"}'

login() { curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\": \"$1\", \"password\": \"Passw0rd!\"}" | jq -r '.accessToken'; }
TOKEN_ALICE=$(login alice@test.com)
TOKEN_BOB=$(login bob@test.com)
TOKEN_CHARLIE=$(login charlie@test.com)

# 3. Alice creates a room; capture its id and invite code
ROOM=$(curl -s -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_ALICE" \
  -d '{"name": "Office Party"}')
ROOM_ID=$(echo "$ROOM" | jq -r '.id')
CODE=$(echo "$ROOM" | jq -r '.inviteCode')

# 4. Bob and Charlie join with the invite code
for T in "$TOKEN_BOB" "$TOKEN_CHARLIE"; do
  curl -s -X POST "http://localhost:3001/api/rooms/$ROOM_ID/join" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $T" \
    -d "{\"inviteCode\": \"$CODE\"}" > /dev/null
done

# 5. Creator runs the draw (now that there are 3 participants)
curl -i -X POST "http://localhost:3001/api/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: 200, room with status "drawn" (with < 3 participants it would be 400)

# 6. Draw again → rejected
curl -i -X POST "http://localhost:3001/api/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: 400 "Draw has already been performed"

# 7. Non-creator (Bob) cannot draw
curl -i -X POST "http://localhost:3001/api/rooms/$ROOM_ID/draw" \
  -H "Authorization: Bearer $TOKEN_BOB"
# Expected: 403 Forbidden

# 8. Each user sees only their OWN assignment
curl "http://localhost:3001/api/rooms/$ROOM_ID/assignment" \
  -H "Authorization: Bearer $TOKEN_ALICE"
# Expected: { "receiver": { "id": "...", "displayName": "Bob" | "Charlie", "wishlist": [] } }
```
