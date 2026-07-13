# Lesson 04: Authorization — Roles & Permissions

## Quick Overview

So far every logged-in user can do everything: the only gate is "do you have a
valid JWT?". That is **authentication** (who are you), not **authorization** (what
are you allowed to do). In this lesson you add real, room-scoped authorization so
that the person who **created** a room can do more than someone who was merely
**invited**.

By the end you will have:

- A room-scoped role per participant: `owner` or `member`.
- A reusable `RoomPermissionsGuard` that enforces **permissions** on routes.
- Owner-only endpoints: edit, delete, kick a member, regenerate the invite code
  (and the existing draw becomes owner-only too).
- A `viewerPermissions` array on every room response.
- A frontend that **hides and disables** owner-only controls (and refuses to fire
  their actions) based on permissions.
- Backend **and** frontend tests proving the rules.

---

## 1. Theory

### Authentication vs authorization

- **Authentication** — verifying identity. You already do this with the JWT and
  `JwtAuthGuard`.
- **Authorization** — deciding what an identity may do. That is this lesson.

### Roles vs permissions — and why we authorize by permission

A **role** is a label (`owner`, `member`). A **permission** is a specific
capability (`room:draw`, `room:kick`). The trap is to scatter `if (role === 'owner')`
checks through the code. The day you add a third role, you have to hunt down every
such check.

Instead: **authorize by permission, never by role.** A role is just a named
**preset** of permissions. Code asks "does the caller hold `room:draw`?" — it
never asks "is the caller an owner?". The only place a role becomes a set of
permissions is one map:

```ts
// santa-api/src/rooms/permissions.ts  (provided)
export const ROLE_PERMISSIONS: Record<RoomRole, readonly Permission[]> = {
  owner:  ['room:view', 'room:draw', 'room:invite', 'room:kick', 'room:edit', 'room:delete', 'wishlist:set'],
  member: ['room:view', 'wishlist:set'],
};
```

> **Why this matters:** adding a `co-organizer` role should be a *one-line* change
> to this map — nothing else (guard, routes, decorators, frontend) should need to
> change. If it does, the authorization is leaking role checks somewhere.

### NestJS guards, custom decorators & metadata

NestJS authorization is built from three pieces (all provided as scaffolding):

- A **custom decorator** that tags a route with the permissions it needs, using
  `SetMetadata`:
  ```ts
  @RequirePermissions('room:draw')
  ```
- A **guard** (`CanActivate`) that runs after `JwtAuthGuard`, reads that metadata
  with the `Reflector`, loads the caller's membership, and allows or denies.
- The **`Reflector`** to read the metadata at request time.

A request that lacks a required permission gets **403**; a caller who is not a
participant of the room gets **404** (we don't reveal that the room exists).

### Defense in depth on the frontend

Hiding a button is **not** security — anyone can call the API directly (the guard
is the real gate). But good UX still hides/disables what you can't do. So on the
frontend you gate on the same permissions the API reports:

- **Hide** owner-only controls members can't use, or **disable** them with a hint.
- Also **guard the handler** so a programmatically-triggered click can't fire the
  request.

The API hands you the caller's permissions directly as
`room.viewerPermissions`, so the frontend never recomputes them from the role.

---

## 2. What you build

### Backend (`santa-api`)

1. **Membership carries a role.** The room schema now stores
   `participants: { userId, role }`. On `create`, the creator is `owner`; on
   `join`, the new participant is `member`.
2. **Implement `RoomPermissionsGuard.canActivate`** (`src/rooms/guards/`):
   read required permissions from metadata; if none, allow. Otherwise find the
   caller's participant entry (room id is `:id`, or `:roomId` on wishlist routes),
   resolve their role with `permissionsForRole(role)`, and require every requested
   permission. Non-member → `404`; missing permission → `403`. **Check
   permissions, never the role string.**
3. **Populate `viewerPermissions`** on every room response (the caller's
   permissions for that room).
4. **Implement the owner-only service methods**: `editRoom`, `deleteRoom`,
   `kickMember` (never remove the owner → `400`), `regenerateInviteCode`.

The routes, DTOs, decorator, guard skeleton, permission catalog, and Swagger docs
are already provided — you fill in the logic.

### Frontend (`santa-app`)

5. **Implement `usePermissions(room)`** (`src/features/rooms/usePermissions.ts`):
   return `can(p)` backed by `room.viewerPermissions`.
6. **Gate the room UI**: render owner-only controls (Draw, Edit, Delete, Kick,
   Regenerate invite) only when `can(...)`; disable where appropriate; and ensure
   the action handlers early-return when the permission is absent.

---

## 3. Your spec — three sources that agree

- **`santa-api/docs/api-contract.md`** — the Roles & Permissions table, the room
  shape (`participants[].role`, `viewerPermissions`), and every owner-only
  endpoint's request/response and error codes.
- **The `TODO` comments** on the guard and the service stubs — what each must do.
- **The tests** — backend `santa-api/test/rooms.e2e-spec.ts` and frontend
  `santa-app/src/features/rooms/usePermissions.test.tsx`. Both ship as `it.todo`
  skeletons; turn each into a real, passing test as you implement.

---

## 4. Test it

```bash
# Backend
cd santa-api && npm run test:e2e        # turn the Lesson 04 it.todo cases green

# Frontend
cd santa-app && npm test                # turn the gating it.todo cases green
```

> **Why your multi-user tests don't hit the rate limiter.** These authorization
> tests register several users (an owner plus members), but `POST /auth/register`
> is throttled (3/min). To keep tests deterministic, `AppModule` skips throttling
> under test:
>
> ```ts
> // santa-api/src/app.module.ts
> ThrottlerModule.forRoot({
>   throttlers: [{ ttl: 60_000, limit: 100 }],
>   skipIf: () => process.env.NODE_ENV === 'test', // Jest sets NODE_ENV=test
> }),
> ```
>
> `skipIf` disables the guard only when it returns `true`, so **production rate
> limiting is unchanged** — it's off solely for the in-memory test run. (Same
> `NODE_ENV` switch you used for config validation in Lesson 02.)

Manually: create a room (you are `owner`), have a second user join (they are
`member`). As the member, the Draw/Edit/Delete/Kick controls should be gone or
disabled, and the corresponding API calls should return `403`. As the owner they
should work.

---

## 5. Stretch — add a third role

Prove the design holds: add a `co-organizer` role that can invite and view but not
delete. You should only need to add **one line** to `ROLE_PERMISSIONS` (and the
`RoomRole` union) — no guard, route, or frontend change. If you find yourself
editing anything else, you have a role check leaking somewhere — fix it to ask for
a permission instead.
