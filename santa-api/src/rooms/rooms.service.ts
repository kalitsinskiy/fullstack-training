import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import {
  PaginatedResponse,
  PaginationQuery,
  paginate,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { permissionsForRole } from './permissions';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel, type RoomDocument } from './schemas/room.schema';
import { randomInt } from 'crypto';
import { generateAssignments } from '../utils/derangement';

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
    const inviteCode = await this.generateUniqueInviteCode();

    try {
      const newRoom = await this.roomModel.create({
        name: dto.name.trim(),
        creatorId,
        inviteCode,
        participants: [{ userId: creatorId, role: 'owner' }],
        status: 'pending',
        ...(dto.budget !== undefined
          ? { budget: dto.budget, currency: dto.currency ?? '$' }
          : {}),
      });

      await newRoom.populate('participants.userId', 'displayName');

      return this.toRoomResponse(newRoom, creatorId);
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException(
          'A room with this name already exists for this creator',
        );
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
    const results = await paginate(this.roomModel, filter, query);

    await this.roomModel.populate(results.data, {
      path: 'participants.userId',
      select: 'displayName',
    });

    return {
      data: results.data.map((doc) =>
        this.toRoomResponse(doc as RoomDocument, userId),
      ),
      meta: results.meta,
    };
  }

  // TODO (Kickoff): return a room by id, but only if the user is a participant.
  // A non-participant (or unknown id) must be indistinguishable: throw
  // NotFoundException (404) in both cases — don't reveal that the room exists.
  async findByIdForUser(id: string, userId: string): Promise<Room> {
    const room = await this.getSharedRoom(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.participants.some((p) => p.id.toString() === userId)) {
      throw new NotFoundException('Room not found');
    }

    const viewer = room.participants.find(
      (participant) => participant.id === userId,
    );

    if (!viewer) {
      return room;
    }

    return {
      ...room,
      viewerPermissions: [...permissionsForRole(viewer.role)],
    };
  }

  // TODO (Kickoff): join a room by id, authorised by the invite code in the body.
  // The new participant is added with role 'member'.
  // Reject a wrong code, and a room whose draw is already done.
  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    const room = await this.roomModel.findById(id).exec();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }

    if (room.status === 'drawn') {
      throw new ForbiddenException('Draw already completed');
    }

    const alreadyMember = room.participants.some(
      (participant) => participant.userId.toString() === userId,
    );

    if (!alreadyMember) {
      room.participants.push({
        userId: Types.ObjectId.createFromHexString(userId),
        role: 'member',
      });
      await room.save();
    }

    await room.populate('participants.userId', 'displayName');
    return this.toRoomResponse(room, userId);
  }

  async joinByCode(inviteCode: string, userId: string): Promise<Room> {
    if (!inviteCode || !inviteCode.trim()) {
      throw new BadRequestException('Invite code is required');
    }
    const room = await this.roomModel.findOne({ inviteCode: inviteCode.trim() }).exec();
    if (!room) {
      throw new BadRequestException('Invalid invite code');
    }
    return this.join(room._id.toString(), inviteCode.trim(), userId);
  }

  // TODO (Lesson 03): only the creator may draw, and only once, with >= 3 participants.
  // Produce a derangement (Sattolo / Fisher–Yates with rejection — no self-assignment)
  // and persist ALL assignments in a single document write (atomic, no transaction).
  // Save `exchangeDate` (required) so every participant sees the gift-exchange day.
  async draw(id: string, requesterId: string, exchangeDate: string): Promise<Room> {
    if (!exchangeDate || isNaN(Date.parse(exchangeDate))) {
      throw new BadRequestException('Valid exchangeDate is required');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Only the room creator can trigger the draw');
    }

    if (room.status === 'drawn') {
      throw new BadRequestException('Draw has already been performed');
    }

    if (room.participants.length < 3) {
      throw new BadRequestException('Need at least 3 participants to draw');
    }

    const participantUserIds = room.participants.map((p) => p.userId);
    const assignments = generateAssignments(participantUserIds);

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
      .populate('participants.userId', 'displayName')
      .exec();

    if (!updated) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(updated, requesterId);
  }

  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isParticipant = room.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Not a room participant');
    }

    if (room.status !== 'drawn') {
      throw new BadRequestException('Draw not completed yet');
    }

    const assignment = room.assignments.find(
      (a) => a.giverId.toString() === userId,
    );

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const receiverIdStr = assignment.receiverId.toString();
    const receiverUser = await this.usersService.findById(receiverIdStr);
    const wishlist = await this.wishlistService.get(id, receiverIdStr);

    return {
      receiver: {
        id: receiverUser.id,
        displayName: receiverUser.displayName,
        wishlist: wishlist.items,
      },
    };
  }

  async editRoom(id: string, dto: UpdateRoomDto, userId: string): Promise<Room> {
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId.toString() !== userId) {
      throw new ForbiddenException('Only the room creator can edit the room');
    }

    const updates: Partial<RoomModel> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.budget !== undefined) updates.budget = dto.budget;
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.exchangeDate !== undefined) updates.exchangeDate = new Date(dto.exchangeDate);

    const updated = await this.roomModel
      .findByIdAndUpdate(id, updates, { new: true })
      .populate('participants.userId', 'displayName')
      .exec();

    if (!updated) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomResponse(updated, userId);
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

  private async generateUniqueInviteCode(len: number = 6): Promise<string> {
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < len; i++) {
        code += alphabet[randomInt(0, alphabet.length)];
      }

      const exists = await this.roomModel.findOne({ inviteCode: code });
      if (!exists) {
        return code;
      }
    }

    throw new Error('Failed to generate unique invite code');
  }

  private toRoomResponse(doc: RoomDocument, viewerId?: string): Room {
    const participants = (doc.participants ?? []).map((participant) => {
      const user = participant.userId as unknown as {
        _id: { toString(): string };
        displayName: string;
      };

      return {
        id: user._id.toString(),
        displayName: user.displayName,
        role: participant.role,
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
      const mine = participants.find(
        (participant) => participant.id === viewerId,
      );
      if (mine) room.viewerPermissions = [...permissionsForRole(mine.role)];
    }

    return room;
  }

  private async getSharedRoom(id: string): Promise<Room | null> {
    const doc = await this.roomModel
      .findById(id)
      .populate('participants.userId', 'displayName')
      .exec();

    if (!doc) {
      return null;
    }

    const shared = this.toRoomResponse(doc);

    return shared;
  }
}
