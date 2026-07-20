import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { RoomPermissionsGuard } from './room-permissions.guard';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { Permission } from '../permissions';

describe('RoomPermissionsGuard', () => {
  let guard: RoomPermissionsGuard;
  let reflector: Reflector;
  const roomModel = { findOne: jest.fn() };

  const ownerId = new Types.ObjectId().toString();
  const memberId = new Types.ObjectId().toString();
  const roomId = new Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = new Reflector();
    guard = new RoomPermissionsGuard(reflector, roomModel as any);
  });

  function makeContext(
    userId: string,
    params: Record<string, string>,
  ): ExecutionContext {
    return {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: userId }, params }),
      }),
    } as unknown as ExecutionContext;
  }

  function mockRoom(participants: { userId: string; role: string }[] | null) {
    roomModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(
        participants
          ? {
              id: roomId,
              participants: participants.map((p) => ({
                userId: new Types.ObjectId(p.userId),
                role: p.role,
              })),
            }
          : null,
      ),
    });
  }

  it('allows the request when no permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(
      makeContext(ownerId, { id: roomId }),
    );

    expect(result).toBe(true);
    expect(roomModel.findOne).not.toHaveBeenCalled();
  });

  it('allows an owner who holds the required permission', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['room:draw'] as Permission[]);
    mockRoom([{ userId: ownerId, role: 'owner' }]);

    const result = await guard.canActivate(
      makeContext(ownerId, { id: roomId }),
    );

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when a member lacks the required permission', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['room:draw'] as Permission[]);
    mockRoom([
      { userId: ownerId, role: 'owner' },
      { userId: memberId, role: 'member' },
    ]);

    await expect(
      guard.canActivate(makeContext(memberId, { id: roomId })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a member for a permission their role grants', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['room:view'] as Permission[]);
    mockRoom([
      { userId: ownerId, role: 'owner' },
      { userId: memberId, role: 'member' },
    ]);

    const result = await guard.canActivate(
      makeContext(memberId, { id: roomId }),
    );

    expect(result).toBe(true);
  });

  it('throws NotFoundException when the caller is not a participant', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['room:view'] as Permission[]);
    mockRoom(null);

    await expect(
      guard.canActivate(makeContext(memberId, { id: roomId })),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for an invalid room id', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['room:view'] as Permission[]);

    await expect(
      guard.canActivate(makeContext(ownerId, { id: 'not-an-object-id' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('reads the room id from :roomId on wishlist routes', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['wishlist:set'] as Permission[]);
    mockRoom([{ userId: memberId, role: 'member' }]);

    const result = await guard.canActivate(
      makeContext(memberId, { roomId }),
    );

    expect(result).toBe(true);
    expect(roomModel.findOne).toHaveBeenCalled();
  });

  it('reads REQUIRE_PERMISSIONS_KEY metadata from handler and class', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    await guard.canActivate(makeContext(ownerId, { id: roomId }));

    expect(spy).toHaveBeenCalledWith(
      REQUIRE_PERMISSIONS_KEY,
      expect.any(Array),
    );
  });
});
