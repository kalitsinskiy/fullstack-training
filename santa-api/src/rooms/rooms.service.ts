import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'node:crypto';
import { isValidObjectId, Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RedisService } from '../redis/redis.service';
import { EventPublisherService } from '../events/event-publisher.service';
import {
  PaginatedResponse,
  PaginationQuery,
  paginate,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignmentView, Room } from './room.types';
import { permissionsForRole, Permission } from './permissions';
import { derange } from './derangement';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const ROOM_CACHE_TTL = 300; // 5 minutes
const roomCacheKey = (id: string) => `room:${id}`;
const INVITE_TTL = 48 * 60 * 60; // 48 hours
const inviteKey = (code: string) => `invite:${code}`;

/** The cacheable, caller-agnostic room shape (no viewerPermissions). */
type RoomBase = Omit<Room, 'viewerPermissions'>;

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
    private readonly redis: RedisService,
    private readonly events: EventPublisherService,
  ) {}

  // Caller-agnostic shape — safe to cache (viewerPermissions are added per caller).
  private async toRoomBase(doc: RoomDocument): Promise<RoomBase> {
    const participants = await Promise.all(
      doc.participants.map(async (p) => {
        const user = await this.usersService.findById(p.userId.toString());
        return { id: user.id, displayName: user.displayName, role: p.role };
      }),
    );
    return {
      id: doc._id.toString(),
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      inviteCode: doc.inviteCode,
      participants,
      participantCount: doc.participants.length,
      status: doc.status,
      drawDate: doc.drawDate ? doc.drawDate.toISOString() : undefined,
      budget: doc.budget,
      currency: doc.currency,
      exchangeDate: doc.exchangeDate
        ? doc.exchangeDate.toISOString()
        : undefined,
    };
  }

  /** Attach the caller's permissions to a base shape. */
  private withViewer(base: RoomBase, viewerUserId?: string): Room {
    const viewer = viewerUserId
      ? base.participants.find((p) => p.id === viewerUserId)
      : undefined;
    const viewerPermissions: Permission[] = viewer
      ? [...permissionsForRole(viewer.role)]
      : [];
    return { ...base, viewerPermissions };
  }

  /** Drop the cached room (call after any mutation). */
  private async invalidateRoom(id: string): Promise<void> {
    await this.redis.del(roomCacheKey(id));
  }

  private async toRoomView(
    doc: RoomDocument,
    viewerUserId?: string,
  ): Promise<Room> {
    return this.withViewer(await this.toRoomBase(doc), viewerUserId);
  }

  private async generateInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        // CSPRNG: invite codes are access tokens, so they must be unpredictable.
        code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
      }
      const exists = await this.roomModel.exists({ inviteCode: code });
      if (!exists) {
        return code;
      }
    }
    throw new Error('Could not generate a unique invite code');
  }

  // Create a room with a unique invite code; the creator is the first
  // participant with role 'owner'. Status starts as 'pending'.
  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    const inviteCode = await this.generateInviteCode();
    try {
      const doc = await this.roomModel.create({
        name: dto.name.trim(),
        creatorId: new Types.ObjectId(creatorId),
        inviteCode,
        budget: dto.budget,
        currency: dto.budget ? (dto.currency ?? '$') : undefined,
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        status: 'pending',
      });
      // Invite code lives in Redis with a 48h TTL — expires automatically.
      await this.redis.set(
        inviteKey(inviteCode),
        doc._id.toString(),
        INVITE_TTL,
      );
      // Emit AFTER the DB write succeeds.
      this.events.publish('room.created', {
        roomId: doc._id.toString(),
        roomName: doc.name,
        createdBy: creatorId,
      });
      return this.toRoomView(doc, creatorId);
    } catch (err: unknown) {
      // Duplicate key on the { creatorId, name } unique index → this user already
      // has a room with this name (different users may reuse a name).
      if ((err as { code?: number })?.code === 11000) {
        throw new ConflictException('You already have a room with this name');
      }
      throw err;
    }
  }

  // List rooms where the user is a participant (paginated).
  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const result = await paginate(
      this.roomModel,
      { 'participants.userId': new Types.ObjectId(userId) },
      query,
    );
    const data = await Promise.all(
      result.data.map((d) => this.toRoomView(d as RoomDocument, userId)),
    );
    return { data, meta: result.meta };
  }

  // Return a room by id, but only if the user is a participant.
  // A non-participant is indistinguishable from an unknown id: both 404.
  // Cache-aside: the caller-agnostic base is cached under room:{id} (5 min TTL);
  // viewerPermissions are computed per caller after the cache lookup.
  async findByIdForUser(id: string, userId: string): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const cacheKey = roomCacheKey(id);
    let base: RoomBase;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Room cache HIT: ${cacheKey}`);
      base = JSON.parse(cached) as RoomBase;
    } else {
      const doc = await this.roomModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException('Room not found');
      }
      base = await this.toRoomBase(doc);
      await this.redis.set(cacheKey, JSON.stringify(base), ROOM_CACHE_TTL);
      this.logger.debug(`Room cache MISS: ${cacheKey}`);
    }
    const isMember = base.participants.some((p) => p.id === userId);
    if (!isMember) {
      throw new NotFoundException('Room not found');
    }
    return this.withViewer(base, userId);
  }

  // Join a room by id, authorised by the invite code. New participant is 'member'.
  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Room not found');
    }
    // Validity/expiry of the invite code is owned by Redis (48h TTL).
    const mappedRoomId = await this.redis.get(inviteKey(inviteCode));
    if (mappedRoomId !== id) {
      throw new BadRequestException('Invalid or expired invite code');
    }
    if (doc.status === 'drawn') {
      throw new ForbiddenException('Draw already completed');
    }
    const already = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!already) {
      doc.participants.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
      });
      await doc.save();
      this.events.publish('user.joined', { roomId: id, userId });
    }
    await this.invalidateRoom(id);
    return this.toRoomView(doc, userId);
  }

  // Join using ONLY the invite code: resolve it to a room via Redis, then join.
  // (Invitees have the code, not the room id — see Lesson 05.)
  async joinByCode(inviteCode: string, userId: string): Promise<Room> {
    const roomId = await this.redis.get(inviteKey(inviteCode));
    if (!roomId) {
      throw new BadRequestException('Invalid or expired invite code');
    }
    return this.join(roomId, inviteCode, userId);
  }

  // Only the creator may draw, once, with >= 3 participants. The whole draw is
  // persisted in ONE findByIdAndUpdate (single-document write = atomic).
  async draw(
    id: string,
    requesterId: string,
    exchangeDate: string,
  ): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Only the room creator can run the draw');
    }
    if (room.status === 'drawn') {
      throw new BadRequestException('Draw has already been performed');
    }
    if (room.participants.length < 3) {
      throw new BadRequestException('Need at least 3 participants to draw');
    }

    const giverIds = room.participants.map((p) => p.userId.toString());
    const receivers = derange(giverIds);
    const assignments = giverIds.map((giverId, i) => ({
      giverId: new Types.ObjectId(giverId),
      receiverId: new Types.ObjectId(receivers[i]),
    }));

    const updated = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          status: 'drawn',
          drawDate: new Date(),
          exchangeDate: new Date(exchangeDate),
          assignments,
        },
        { new: true },
      )
      .exec();
    await this.invalidateRoom(id);
    this.events.publish('draw.completed', {
      roomId: id,
      participantCount: room.participants.length,
    });
    return this.toRoomView(updated as RoomDocument, requesterId);
  }

  // Return the giftee assigned to this user (+ their wishlist). Only a participant
  // of a drawn room may read it, and only ever their OWN assignment.
  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const isMember = room.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!isMember) {
      throw new NotFoundException('Room not found');
    }
    if (room.status !== 'drawn') {
      throw new BadRequestException('The draw has not been performed yet');
    }
    const mine = room.assignments.find((a) => a.giverId.toString() === userId);
    if (!mine) {
      throw new NotFoundException('Assignment not found');
    }
    const receiver = await this.usersService.findById(
      mine.receiverId.toString(),
    );
    const wishlist = await this.wishlistService.get(
      id,
      mine.receiverId.toString(),
    );
    return {
      receiver: {
        id: receiver.id,
        displayName: receiver.displayName,
        wishlist: wishlist.items,
      },
    };
  }

  // Update the room's fields. Owner-only access is enforced by the guard
  // (@RequirePermissions('room:edit')); the per-creator unique name still applies.
  async editRoom(
    id: string,
    dto: UpdateRoomDto,
    userId: string,
  ): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    // Only set the fields that were actually provided.
    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.budget !== undefined) update.budget = dto.budget;
    if (dto.currency !== undefined) update.currency = dto.currency;
    if (dto.exchangeDate !== undefined) {
      update.exchangeDate = new Date(dto.exchangeDate);
    }
    try {
      const updated = await this.roomModel
        .findByIdAndUpdate(id, update, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException('Room not found');
      }
      await this.invalidateRoom(id);
      // Moving the gift-exchange day concerns everyone → notify all participants.
      if (dto.exchangeDate !== undefined) {
        this.events.publish('room.date_changed', {
          roomId: id,
          exchangeDate: new Date(dto.exchangeDate).toISOString(),
          changedBy: userId, // exclude the actor — they already got local feedback
        });
      }
      return this.toRoomView(updated, userId);
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        throw new ConflictException('You already have a room with this name');
      }
      throw err;
    }
  }

  // Delete the room. Owner-only access is enforced by the guard.
  async deleteRoom(id: string, userId: string): Promise<void> {
    void userId;
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const deleted = await this.roomModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Room not found');
    }
    await this.invalidateRoom(id);
  }

  // Remove a participant. The owner can never be removed (400). Owner-only.
  async kickMember(
    id: string,
    targetUserId: string,
    userId: string,
  ): Promise<void> {
    void userId;
    if (!isValidObjectId(id) || !isValidObjectId(targetUserId)) {
      throw new NotFoundException('Room or member not found');
    }
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const target = room.participants.find(
      (p) => p.userId.toString() === targetUserId,
    );
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === 'owner') {
      throw new BadRequestException('Cannot remove the room owner');
    }
    room.participants = room.participants.filter(
      (p) => p.userId.toString() !== targetUserId,
    );
    await room.save();
    await this.invalidateRoom(id);
  }

  // Generate a fresh unique invite code, invalidating the old one. Owner-only.
  async regenerateInviteCode(id: string, userId: string): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const oldCode = room.inviteCode;
    room.inviteCode = await this.generateInviteCode();
    await room.save();
    // Swap the Redis invite mapping: drop the old code, register the new one.
    await this.redis.del(inviteKey(oldCode));
    await this.redis.set(inviteKey(room.inviteCode), id, INVITE_TTL);
    await this.invalidateRoom(id);
    return this.toRoomView(room, userId);
  }
}
