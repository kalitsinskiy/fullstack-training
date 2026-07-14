import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { PaginatedResponse, PaginationQuery } from '../common/pagination';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { permissionsForRole, RoomRole } from './permissions';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel } from './schemas/room.schema';

const INVITE_CODE_ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
const INVITE_CODE_LENGTH = 6;

type PopulatedParticipant = { userId: UserDocument; role: RoomRole };

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
  ) {}

  // NOTE: every room response uses the shape in docs/api-contract.md — map
  // participants to populated { id, displayName, role }, include participantCount,
  // and set `viewerPermissions` to the calling user's permissions for that room
  // (resolve their role via permissionsForRole() from ./permissions).

  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    const creatorObjectId = new Types.ObjectId(creatorId);
    const room = await this.roomModel.create({
      name: dto.name,
      creatorId: creatorObjectId,
      inviteCode: await this.generateUniqueInviteCode(),
      participants: [{ userId: creatorObjectId, role: 'owner' }],
      status: 'pending',

      ...(dto.budget !== undefined
        ? { budget: dto.budget, currency: dto.currency ?? '$' }
        : {}),
    });

    return this.toRoomResponse(room._id, creatorId);
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = { 'participants.userId': new Types.ObjectId(userId) };

    const [rooms, total] = await Promise.all([
      this.roomModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate<{
          participants: PopulatedParticipant[];
        }>('participants.userId', 'displayName')
        .exec(),
      this.roomModel.countDocuments(filter).exec(),
    ]);

    return {
      data: rooms.map((room) => this.mapRoom(room, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel
      .findOne({ _id: id, 'participants.userId': new Types.ObjectId(userId) })
      .populate<{ participants: PopulatedParticipant[] }>(
        'participants.userId',
        'displayName',
      )
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.mapRoom(room, userId);
  }

  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }
    if (room.status === 'drawn') {
      throw new ForbiddenException('The draw has already been completed');
    }

    const alreadyMember = room.participants.some(
      (participant) => participant.userId.toString() === userId,
    );
    if (!alreadyMember) {
      room.participants.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
      });
      await room.save();
    }

    return this.toRoomResponse(room._id, userId);
  }

  // TODO (Lesson 05): join using ONLY the invite code. Invitees have the code,
  // not the room id (and a non-member can't open the room to find it). Resolve
  // invite:{code} -> roomId from Redis (you store it in create()), then run the
  // same join logic. 400 if the code is missing/expired.
  joinByCode(inviteCode: string, userId: string): Promise<Room> {
    throw new NotImplementedException(
      'RoomsService.joinByCode is not implemented',
    );
  }

  // TODO (Lesson 03): only the creator may draw, and only once, with >= 3 participants.
  // Produce a derangement (Sattolo / Fisher–Yates with rejection — no self-assignment)
  // and persist ALL assignments in a single document write (atomic, no transaction).
  // Save `exchangeDate` (required) so every participant sees the gift-exchange day.
  draw(id: string, requesterId: string, exchangeDate: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.draw is not implemented');
  }

  // TODO (Lesson 03): return the giftee assigned to this user, plus their wishlist.
  // Only a participant of a drawn room may read it.
  getAssignment(id: string, userId: string): Promise<AssignmentView> {
    throw new NotImplementedException(
      'RoomsService.getAssignment is not implemented',
    );
  }

  // TODO (Lesson 04): update the room's fields (e.g. name). Owner-only access is
  // already enforced by RoomPermissionsGuard via @RequirePermissions('room:edit').
  editRoom(id: string, dto: UpdateRoomDto, userId: string): Promise<Room> {
    throw new NotImplementedException(
      'RoomsService.editRoom is not implemented',
    );
  }

  // TODO (Lesson 04): delete the room. Owner-only access is enforced by the guard.
  deleteRoom(id: string, userId: string): Promise<void> {
    throw new NotImplementedException(
      'RoomsService.deleteRoom is not implemented',
    );
  }

  // TODO (Lesson 04): remove a participant from the room. The owner can never be
  // removed (respond 400). Owner-only access is enforced by the guard.
  kickMember(id: string, targetUserId: string, userId: string): Promise<void> {
    throw new NotImplementedException(
      'RoomsService.kickMember is not implemented',
    );
  }

  // TODO (Lesson 04): generate a fresh unique invite code and persist it.
  // Owner-only access is enforced by the guard.
  regenerateInviteCode(id: string, userId: string): Promise<Room> {
    throw new NotImplementedException(
      'RoomsService.regenerateInviteCode is not implemented',
    );
  }

  private async toRoomResponse(
    roomId: Types.ObjectId | string,
    viewerId: string,
  ): Promise<Room> {
    const room = await this.roomModel
      .findById(roomId)
      .populate<{
        participants: PopulatedParticipant[];
      }>('participants.userId', 'displayName')
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.mapRoom(room, viewerId);
  }

  private mapRoom(
    room: Omit<RoomModel, 'participants'> & {
      _id: Types.ObjectId;
      participants: PopulatedParticipant[];
    },
    viewerId: string,
  ): Room {
    const participants = room.participants.map((participant) => ({
      id: participant.userId._id.toString(),
      displayName: participant.userId.displayName,
      role: participant.role,
    }));

    const result: Room = {
      id: room._id.toString(),
      name: room.name,
      creatorId: room.creatorId.toString(),
      inviteCode: room.inviteCode,
      participants,
      participantCount: participants.length,
      status: room.status,
    };

    if (room.drawDate) {
      result.drawDate = room.drawDate.toISOString();
    }
    if (room.budget !== undefined) {
      result.budget = room.budget;
    }
    if (room.currency !== undefined) {
      result.currency = room.currency;
    }
    if (room.exchangeDate) {
      result.exchangeDate = room.exchangeDate.toISOString();
    }

    const viewer = participants.find(
      (participant) => participant.id === viewerId,
    );
    if (viewer) {
      result.viewerPermissions = [...permissionsForRole(viewer.role)];
    }

    return result;
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
      code += INVITE_CODE_ALPHABET.charAt(
        Math.floor(Math.random() * INVITE_CODE_ALPHABET.length),
      );
    }
    return code;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = this.generateInviteCode();
      const exists = await this.roomModel.exists({ inviteCode: code });
      if (!exists) {
        return code;
      }
    }
    throw new Error('Could not generate a unique invite code');
  }
}
