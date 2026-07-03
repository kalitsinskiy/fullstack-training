import { describe, it } from 'vitest';

/**
 * COMPONENT/HOOK TESTS (Vitest + RTL + MSW) for permission gating — Lesson 04.
 *
 * Gate UI on PERMISSIONS, never on the role. Drive the two cases by what the API
 * returns in `room.viewerPermissions` (stub it via MSW handlers in test/mocks):
 *   - owner  → viewerPermissions includes room:draw / room:kick / room:edit / room:delete
 *   - member → viewerPermissions is ['room:view', 'wishlist:set']
 *
 * Turn each todo into a real test as you implement usePermissions + the gating.
 */
describe('usePermissions', () => {
  it.todo('can() returns true for permissions present in room.viewerPermissions');
  it.todo('can() returns false for absent permissions, and for a null room');
});

describe('room permission gating (UI)', () => {
  it.todo(
    'as owner: Draw / Kick / Edit / Delete controls render and are enabled',
  );
  it.todo('as member: owner-only controls are hidden or disabled');
  it.todo(
    'clicking a disabled/guarded owner-only control does not fire a request (MSW sees no call)',
  );
});
