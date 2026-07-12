import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { randomBytes } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import {
  PaginatedResponse,
  PaginationQuery,
  paginate,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';
import { permissionsForRole } from './permissions';
import { derange } from './derangement';

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

  // TODO (Kickoff): create a room with a unique invite code; the creator is the
  // first participant with role 'owner'. Status starts as 'pending'.
  // STRETCH (optional, see Kickoff §4): make the name unique PER CREATOR — add a
  // compound unique index { creatorId, name } and translate the duplicate-key
  // error (code 11000) into a 409 ConflictException. Don't make names globally
  // unique — different users may reuse a name.
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

      await created.populate('participants.userId', 'displayName');

      return this.toRoomResponse(created, creatorId);
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException('You already have a room with this name');
      }
      throw err;
    }
  }

  // TODO (Kickoff): list rooms where the user is a participant (paginated).
  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const filter = { 'participants.userId': userId };
    const result = await paginate(this.roomModel, filter, query);

    await this.roomModel.populate(result.data, {
      path: 'participants.userId',
      select: 'displayName',
    });

    return {
      data: result.data.map((doc) =>
        this.toRoomResponse(doc as RoomDocument, userId),
      ),
      meta: result.meta,
    };
  }

  // TODO (Kickoff): return a room by id, but only if the user is a participant.
  // A non-participant (or unknown id) must be indistinguishable: throw
  // NotFoundException (404) in both cases — don't reveal that the room exists.
  async findByIdForUser(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomModel
      .findOne({ _id: id, 'participants.userId': userId })
      .populate('participants.userId', 'displayName')
      .exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(room, userId);
  }

  // TODO (Kickoff): join a room by id, authorised by the invite code in the body.
  // The new participant is added with role 'member'.
  // Reject a wrong code, and a room whose draw is already done.
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
    }

    await room.populate('participants.userId', 'displayName');

    return this.toRoomResponse(room, userId);
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

    // Guard is a passthrough until L04, so enforce creator-only here.
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
      .exec();

    return this.toRoomResponse(updated as RoomDocument, requesterId);
  }

  // TODO (Lesson 03): return the giftee assigned to this user, plus their wishlist.
  // Only a participant of a drawn room may read it.
  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

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

  // TODO (Lesson 04): update the room's fields (e.g. name). Owner-only access is
  // already enforced by RoomPermissionsGuard via @RequirePermissions('room:edit').
  async editRoom(
    id: string,
    dto: UpdateRoomDto,
    userId: string,
  ): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Room not found');
    }

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
        .populate('participants.userId', 'displayName')
        .exec();
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException('You already have a room with this name');
      }

      throw err;
    }

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(room, userId);
  }

  // TODO (Lesson 04): delete the room. Owner-only access is enforced by the guard.
  async deleteRoom(id: string): Promise<void> {
    if (!Types.ObjectId.isValid) {
      throw new NotFoundException('Room not found');
    }

    const deleted = await this.roomModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Room not found');
    }
  }

  // TODO (Lesson 04): remove a participant from the room. The owner can never be
  // removed (respond 400). Owner-only access is enforced by the guard.
  async kickMember(id: string, targetUserId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(targetUserId)) {
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
      throw new BadRequestException('The owner cannot be removed');
    }

    room.participants = room.participants.filter(
      (p) => p.userId.toString() !== targetUserId,
    );
    await room.save();
  }

  // TODO (Lesson 04): generate a fresh unique invite code and persist it.
  // Owner-only access is enforced by the guard.
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
    await room.populate('participants.userId', 'displayName');

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
      const user = p.userId as unknown as {
        _id: Types.ObjectId;
        displayName: string;
      };

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

    if (viewerId) {
      const mine = participants.find((p) => p.id === viewerId);
      if (mine) room.viewerPermissions = [...permissionsForRole(mine.role)];
    }

    return room;
  }
}
