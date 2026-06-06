# Lesson 03: Rooms & Draw

## Quick Overview

The heart of Secret Santa is the **draw** -- randomly assigning each participant to another participant such that nobody draws themselves. This is a classic computer science problem called a **derangement** (a permutation with no fixed points).

Beyond the algorithm, the draw must be **atomic**: either all assignments are saved to the database, or none are. If the server crashes mid-save, you should not end up with half the participants assigned and half not. MongoDB transactions give you this guarantee.

By the end of this lesson you will have:

- An Assignment schema in MongoDB
- A draw endpoint that uses a derangement algorithm
- Atomic saving of all assignments using a MongoDB transaction
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

### 5. MongoDB Transactions

MongoDB supports multi-document transactions (on replica sets). A transaction groups multiple operations into an atomic unit: either all succeed, or all are rolled back.

```typescript
const session = await mongoose.startSession();

try {
  session.startTransaction();

  // All operations use the same session
  await Assignment.insertMany(assignments, { session });
  await Room.findByIdAndUpdate(
    roomId,
    { status: 'drawn' },
    { session }
  );

  // If we get here, commit
  await session.commitTransaction();
} catch (error) {
  // Something failed, roll back everything
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Key points:**

- You must pass the `session` to every operation that should be part of the transaction.
- If any operation fails, `abortTransaction()` undoes all changes.
- MongoDB transactions require a **replica set**. For local development, you can use `mongodb-memory-server` with `--replSet` or run a single-node replica set in Docker.

### 6. Running MongoDB as a Replica Set in Docker

Transactions require a replica set. Update your Docker Compose mongo service:

```yaml
mongo:
  image: mongo:7
  command: ['--replSet', 'rs0']
  ports:
    - '27017:27017'
  volumes:
    - mongo-data:/data/db
  healthcheck:
    test: |
      mongosh --quiet --eval "
        try { rs.status().ok } 
        catch(e) { rs.initiate().ok }
      "
    interval: 10s
    timeout: 5s
    retries: 5
```

The healthcheck initializes the replica set on first run. After the replica set is initialized, transactions work.

### 7. Error Handling and Idempotency

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

### Step 1: Create the Assignment schema

In **santa-api**, create a new Mongoose schema and module for assignments:

```typescript
// Schema fields:
// - giverId:    ObjectId (ref: 'User'), required
// - receiverId: ObjectId (ref: 'User'), required
// - roomId:     ObjectId (ref: 'Room'), required
// - timestamps: true
```

Create the corresponding NestJS module (`AssignmentModule`), service, and controller. Register it in `AppModule`.

Add a compound index on `{ roomId, giverId }` to ensure one assignment per giver per room.

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
4. **Save atomically** using a MongoDB transaction:
   - Insert all assignment documents
   - Update room status to "drawn"
   - If anything fails, abort the transaction
5. **Return** the created assignments (or just a success message).

Update your Room schema to include a `status` field if it does not have one already (`'open' | 'drawn'`, default `'open'`).

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

### Step 6: Ensure MongoDB replica set for transactions

Update your `docker-compose.yml` to run MongoDB as a replica set (see Key Concepts section 6). This is required for transactions to work.

If you are developing locally without Docker, you can:
- Use `mongodb-memory-server` with replica set mode in tests
- Or run `mongosh` and execute `rs.initiate()` on a local MongoDB started with `--replSet rs0`

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
