import { withViewerPermissions } from './room-view';
import type { Room } from './room.types';

const shared: Room = {
  id: 'r1',
  name: 'Office Party',
  creatorId: 'u1',
  inviteCode: 'ABC123',
  participants: [
    { id: 'u1', displayName: 'Alice', role: 'owner' },
    { id: 'u2', displayName: 'Alex', role: 'member' },
  ],
  participantCount: 2,
  status: 'pending',
};

describe('withViewerPermissions', () => {
  it('gives the owner the full owner perms', () => {
    expect(withViewerPermissions(shared, 'u1').viewerPermissions).toContain(
      'room:delete',
    );
  });

  it('gives a member exactly room:view + wishlist:set', () => {
    expect(
      [...(withViewerPermissions(shared, 'u2').viewerPermissions ?? [])].sort(),
    ).toEqual(['room:view', 'wishlist:set']);
  });

  it('leaves viewerPermissions unset for a non-participant', () => {
    expect(
      withViewerPermissions(shared, 'stranger').viewerPermissions,
    ).toBeUndefined();
  });
});
