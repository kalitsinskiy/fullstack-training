import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { rethrowDuplicateKey } from '../common/mongo-errors';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RedisService } from '../redis/redis.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { withViewerPermissions } from './room-view';
import {
  PaginatedResponse,
  PaginationQuery,
  paginate,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  AssignmentView,
  PopulatedUser,
  Room,
  RoomRelations,
} from './room.types';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';
import { derange } from './derangement';

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

  private readonly ROOM_CACHE_TTL = 300; // 5 minutes
  private readonly INVITE_TTL = 48 * 60 * 60; // 48h = 172800s

  private static readonly PARTICIPANT_POPULATE = {
    path: 'participants.userId',
    select: 'displayName',
  } as const;

  /**
   * Fetch a room document or throw 404
   */
  private async loadRoom(id: string): Promise<RoomDocument> {
    const room = await this.roomModel.findById(id).exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  private async populateParticipants(doc: RoomDocument): Promise<RoomDocument> {
    return doc.populate(RoomsService.PARTICIPANT_POPULATE);
  }

  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    try {
      const created = await this.roomModel.create({
        name: dto.name.trim(),
        creatorId,
        inviteCode: await this.generateUniqueInviteCode(),
        participants: [{ userId: creatorId, role: 'owner' }],
        status: 'pending',
        ...(dto.budget !== undefined
          ? { budget: dto.budget, currency: dto.currency ?? '$' }
          : {}),
      });

      await this.populateParticipants(created);

      try {
        await this.redis.set(
          `invite:${created.inviteCode}`,
          created._id.toString(),
          this.INVITE_TTL,
        );
      } catch (err: unknown) {
        this.logger.warn(
          { err, roomId: created._id.toString() },
          'Failed to cache invite code - join-by-code will fallback to Mongo',
        );
      }

      this.events.publish('room.created', {
        roomId: created._id.toString(),
        roomName: created.name,
        createdBy: creatorId,
      });

      return this.toRoomResponse(created, creatorId);
    } catch (err) {
      rethrowDuplicateKey(err, 'You already have a room with this name');
    }
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const filter = { 'participants.userId': userId };
    const result = await paginate(this.roomModel, filter, query);

    await this.roomModel.populate(
      result.data,
      RoomsService.PARTICIPANT_POPULATE,
    );

    return {
      data: result.data.map((doc) =>
        this.toRoomResponse(doc as RoomDocument, userId),
      ),
      meta: result.meta,
    };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    const room = await this.getSharedRoom(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.participants.some((p) => p.id === userId)) {
      throw new NotFoundException('Room not found');
    }

    return withViewerPermissions(room, userId);
  }

  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    const room = await this.loadRoom(id);

    if (room.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }
    if (room.status === 'drawn') {
      throw new ForbiddenException('The draw for this room is already done');
    }

    const already = room.participants.some(
      (p) => p.userId.toString() === userId,
    );

    if (!already) {
      room.participants.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
      });
      await room.save();
      await this.invalidateRoom(id);

      const joiner = await this.usersService.findById(userId);

      this.events.publish('user.joined', {
        roomId: id,
        userId,
        userName: joiner.displayName,
      });
    }

    await this.populateParticipants(room);

    return this.toRoomResponse(room, userId);
  }

  async joinByCode(inviteCode: string, userId: string): Promise<Room> {
    const roomId = await this.redis.get(`invite:${inviteCode}`);

    if (!roomId) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    return this.join(roomId, inviteCode, userId);
  }

  async draw(
    id: string,
    requesterId: string,
    exchangeDate: string,
  ): Promise<Room> {
    const room = await this.loadRoom(id);

    if (room.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Only the room creator can run the draw');
    }

    if (room.status === 'drawn') {
      throw new BadRequestException('The draw has already been performed');
    }

    if (room.participants.length < 3) {
      throw new BadRequestException(
        'At least 3 participants are required to run the draw',
      );
    }

    const giverIds = room.participants.map((p) => p.userId.toString());
    const receiversIds = derange(giverIds);
    const assignments = giverIds.map((giverId, index) => ({
      giverId: new Types.ObjectId(giverId),
      receiverId: new Types.ObjectId(receiversIds[index]),
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
      .populate(RoomsService.PARTICIPANT_POPULATE)
      .exec();

    if (!updated) {
      throw new NotFoundException('Room not found');
    }

    await this.invalidateRoom(id);

    this.events.publish('draw.completed', {
      roomId: id,
      participantCount: room.participants.length,
      requesterId,
    });

    return this.toRoomResponse(updated, requesterId);
  }

  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    const room = await this.roomModel
      .findOne({ _id: id, 'participants.userId': userId })
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== 'drawn') {
      throw new BadRequestException('The draw has not been performed yet');
    }

    const assignment = room.assignments.find(
      (a) => a.giverId.toString() === userId,
    );

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const receiverId = assignment.receiverId.toString();
    const receiver = await this.usersService.findById(receiverId);
    const wishlist = await this.wishlistService.get(id, receiverId);

    return {
      receiver: {
        id: receiverId,
        displayName: receiver.displayName,
        wishlist: wishlist.items,
      },
    };
  }

  async editRoom(
    id: string,
    dto: UpdateRoomDto,
    userId: string,
  ): Promise<Room> {
    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.budget !== undefined) update.budget = dto.budget;
    if (dto.currency !== undefined) update.currency = dto.currency;
    if (dto.exchangeDate !== undefined)
      update.exchangeDate = new Date(dto.exchangeDate);

    let room: RoomDocument | null;

    try {
      room = await this.roomModel
        .findByIdAndUpdate(id, update, { new: true })
        .populate(RoomsService.PARTICIPANT_POPULATE)
        .exec();

      await this.invalidateRoom(id);

      if (room && dto.exchangeDate !== undefined) {
        this.events.publish('room.date_changed', {
          roomId: id,
          exchangeDate: room.exchangeDate?.toISOString(),
        });
      }
    } catch (err) {
      rethrowDuplicateKey(err, 'You already have a room with this name');
    }

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(room, userId);
  }

  async deleteRoom(id: string): Promise<void> {
    const deleted = await this.roomModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Room not found');
    }

    await this.invalidateRoom(id);
  }

  async kickMember(id: string, targetUserId: string): Promise<void> {
    const room = await this.loadRoom(id);

    const target = room.participants.find(
      (p) => p.userId.toString() === targetUserId,
    );

    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === 'owner') {
      throw new BadRequestException('The owner cannot be removed');
    }

    room.participants = room.participants.filter(
      (p) => p.userId.toString() !== targetUserId,
    );
    await room.save();
    await this.invalidateRoom(id);
  }

  async regenerateInviteCode(id: string, userId: string): Promise<Room> {
    const room = await this.loadRoom(id);

    const oldCode = room.inviteCode;

    room.inviteCode = await this.generateUniqueInviteCode();
    await room.save();
    await this.redis.del(`invite:${oldCode}`);
    await this.redis.set(`invite:${room.inviteCode}`, id, this.INVITE_TTL);
    await this.invalidateRoom(id);
    await this.populateParticipants(room);

    return this.toRoomResponse(room, userId);
  }

  private generateInviteCode(len = 6): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(
      randomBytes(len),
      (b) => alphabet[b % alphabet.length],
    ).join('');
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.generateInviteCode();
      const exists = await this.roomModel.exists({ inviteCode: code });
      if (!exists) return code;
    }
    throw new Error('Could not generate a unique invite code');
  }

  private toRoomResponse(doc: RoomDocument, viewerId?: string): Room {
    const participants = doc.participants.map((p) => {
      const user = p.userId as unknown as PopulatedUser;

      if (typeof user?.displayName !== 'string') {
        throw new Error(
          `Room ${doc._id.toString()} was mapped with unpopulated participants — ` +
            'the query is missing .populate(PARTICIPANT_POPULATE)',
        );
      }

      return {
        id: user._id.toString(),
        displayName: user.displayName,
        role: p.role,
      };
    });

    const room: Room = {
      id: doc._id.toString(),
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      inviteCode: doc.inviteCode,
      participants,
      participantCount: participants.length,
      status: doc.status,
    };

    if (doc.drawDate) room.drawDate = doc.drawDate.toISOString();
    if (doc.budget !== undefined) room.budget = doc.budget;
    if (doc.currency) room.currency = doc.currency;
    if (doc.exchangeDate) room.exchangeDate = doc.exchangeDate.toISOString();

    return viewerId ? withViewerPermissions(room, viewerId) : room;
  }

  private async getSharedRoom(id: string): Promise<Room | null> {
    const cacheKey = `room:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Room cache HIT: ${cacheKey}`);

      return JSON.parse(cached) as Room;
    }

    this.logger.debug(`Room cache MISS: ${cacheKey}`);

    const doc = await this.roomModel
      .findById(id)
      .populate(RoomsService.PARTICIPANT_POPULATE)
      .exec();

    if (!doc) return null;

    const shared = this.toRoomResponse(doc);

    await this.redis.set(cacheKey, JSON.stringify(shared), this.ROOM_CACHE_TTL);

    return shared;
  }

  private async invalidateRoom(id: string): Promise<void> {
    await this.redis.del(`room:${id}`);
  }

  async getParticipantIds(
    id: string,
  ): Promise<{ id: string; name: string; memberIds: string[] }> {
    const room = await this.roomModel
      .findById(id)
      .select('name participants')
      .lean()
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return {
      id: room._id.toString(),
      name: room.name,
      memberIds: room.participants.map((p) => p.userId.toString()),
    };
  }

  async getRelations(roomId: string, userId: string): Promise<RoomRelations> {
    const room = await this.roomModel
      .findById(roomId)
      .select('assignments')
      .lean()
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const gifteeId =
      room.assignments
        .find((a) => a.giverId.toString() === userId)
        ?.receiverId.toString() ?? null;

    const santaId =
      room.assignments
        .find((a) => a.receiverId.toString() === userId)
        ?.giverId.toString() ?? null;

    return { gifteeId, santaId };
  }
}
