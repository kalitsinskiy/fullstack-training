import { Types } from 'mongoose';
import type { Room } from './room.types';
import { RoomsService } from './rooms.service';
import type { RoomDocument } from './schemas/room.schema';

/**
 * Unit tests for `toRoomResponse`, the mapper every room endpoint funnels
 * through. It reads no injected dependency, so the service can be constructed
 * with stubs.
 *
 * The unpopulated case is the important one: it used to produce
 * `displayName: undefined`, which JSON.stringify strips, so `draw()` silently
 * returned participants with no names and no test noticed.
 */
function makeService(): RoomsService {
  return new RoomsService(
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
  );
}

function roomDoc(participants: unknown[]): RoomDocument {
  return {
    _id: new Types.ObjectId(),
    name: 'Office Party',
    creatorId: new Types.ObjectId(),
    inviteCode: 'Q7X4LM',
    participants,
    status: 'pending',
  } as unknown as RoomDocument;
}

const populated = (displayName: string, role: 'owner' | 'member') => ({
  userId: { _id: new Types.ObjectId(), displayName },
  role,
});

describe('RoomsService.toRoomResponse', () => {
  const service = makeService();

  // A typed wrapper rather than `.bind()`: tsconfig sets
  // strictBindCallApply:false, so `.bind()` would degrade this to `any` and
  // every assertion below would stop being type-checked.
  const toRoomResponse = (doc: RoomDocument, viewerId?: string): Room =>
    service['toRoomResponse'](doc, viewerId);

  it('maps populated participants to { id, displayName, role }', () => {
    const alice = populated('Alice', 'owner');
    const nick = populated('Nick', 'member');
    const doc = roomDoc([alice, nick]);

    const room = toRoomResponse(doc);

    expect(room.participantCount).toBe(2);
    expect(room.participants).toEqual([
      { id: alice.userId._id.toString(), displayName: 'Alice', role: 'owner' },
      { id: nick.userId._id.toString(), displayName: 'Nick', role: 'member' },
    ]);
  });

  it('throws when participants were not populated', () => {
    // A raw ObjectId is what an un-populated path yields. Its `_id` getter
    // returns itself, so the id looks correct while displayName is missing —
    // which is precisely why this needs to be a hard failure.
    const doc = roomDoc([{ userId: new Types.ObjectId(), role: 'owner' }]);

    expect(() => toRoomResponse(doc)).toThrow(/unpopulated participants/);
  });

  it('throws when only SOME participants were populated', () => {
    const doc = roomDoc([
      populated('Alice', 'owner'),
      { userId: new Types.ObjectId(), role: 'member' },
    ]);

    expect(() => toRoomResponse(doc)).toThrow(/unpopulated participants/);
  });

  it('stamps viewerPermissions for a participant', () => {
    const alice = populated('Alice', 'owner');
    const doc = roomDoc([alice]);

    const room = toRoomResponse(doc, alice.userId._id.toString());

    expect(room.viewerPermissions).toContain('room:draw');
  });

  it('gives a member exactly room:view + wishlist:set', () => {
    const nick = populated('Nick', 'member');
    const doc = roomDoc([populated('Alice', 'owner'), nick]);

    const room = toRoomResponse(doc, nick.userId._id.toString());

    expect([...(room.viewerPermissions ?? [])].sort()).toEqual([
      'room:view',
      'wishlist:set',
    ]);
  });

  it('omits viewerPermissions for a non-participant', () => {
    const doc = roomDoc([populated('Alice', 'owner')]);

    const room = toRoomResponse(doc, new Types.ObjectId().toString());

    expect(room.viewerPermissions).toBeUndefined();
  });
});
