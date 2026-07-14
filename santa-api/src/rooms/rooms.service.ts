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
import { generateAssignments } from '../utils/derangement';

const MIN_PARTICIPANTS_TO_DRAW = 3;

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

  async draw(
    id: string,
    requesterId: string,
    exchangeDate: string,
  ): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status === 'drawn') {
      throw new BadRequestException('Draw has already been performed');
    }
    if (room.participants.length < MIN_PARTICIPANTS_TO_DRAW) {
      throw new BadRequestException(
        `Need at least ${MIN_PARTICIPANTS_TO_DRAW} participants to draw`,
      );
    }

    const parsedExchangeDate = new Date(exchangeDate);
    if (Number.isNaN(parsedExchangeDate.getTime())) {
      throw new BadRequestException('exchangeDate must be a valid date');
    }

    const participantIds = room.participants.map((participant) =>
      participant.userId.toString(),
    );
    const assignments = generateAssignments(participantIds).map(
      (assignment) => ({
        giverId: new Types.ObjectId(assignment.giverId),
        receiverId: new Types.ObjectId(assignment.receiverId),
      }),
    );

    // Single atomic write: everything flips together or not at all.
    const updated = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          status: 'drawn',
          drawDate: new Date(),
          exchangeDate: parsedExchangeDate,
          assignments,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(updated._id, requesterId);
  }

  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isParticipant = room.participants.some(
      (participant) => participant.userId.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this room');
    }

    if (room.status !== 'drawn') {
      throw new BadRequestException('The draw has not been performed yet');
    }

    const assignment = room.assignments.find(
      (entry) => entry.giverId.toString() === userId,
    );
    if (!assignment) {
      throw new NotFoundException('No assignment found for this user');
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
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.budget !== undefined) update.budget = dto.budget;
    if (dto.currency !== undefined) update.currency = dto.currency;
    if (dto.exchangeDate !== undefined) {
      const parsed = new Date(dto.exchangeDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('exchangeDate must be a valid date');
      }
      update.exchangeDate = parsed;
    }

    const updated = await this.roomModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(updated._id, userId);
  }

  async deleteRoom(id: string, userId: string): Promise<void> {
    void userId; // authorization handled by the guard
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const deleted = await this.roomModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Room not found');
    }
  }

  async kickMember(
    id: string,
    targetUserId: string,
    userId: string,
  ): Promise<void> {
    void userId; // authorization handled by the guard
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const target = room.participants.find(
      (participant) => participant.userId.toString() === targetUserId,
    );
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === 'owner') {
      throw new BadRequestException('The room owner cannot be removed');
    }

    room.participants = room.participants.filter(
      (participant) => participant.userId.toString() !== targetUserId,
    );
    await room.save();
  }

  async regenerateInviteCode(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    room.inviteCode = await this.generateUniqueInviteCode();
    await room.save();

    return this.toRoomResponse(room._id, userId);
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
