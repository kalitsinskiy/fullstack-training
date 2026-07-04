import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { PaginatedResponse, PaginationQuery, paginate } from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';
import { permissionsForRole } from './permissions';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
  ) {}

  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    const inviteCode = this.generateInviteCode();

    try {
      const doc = await this.roomModel.create({
        name: dto.name.trim(),
        creatorId: new Types.ObjectId(creatorId),
        inviteCode,
        participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
        status: 'pending',
        budget: dto.budget,
        currency: dto.currency,
      });

      return this.toRoom(doc, creatorId);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('A room with this name already exists');
      }
      throw err;
    }
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const filter = { 'participants.userId': new Types.ObjectId(userId) };
    const result = await paginate(this.roomModel, filter, query);
    return {
      data: result.data.map((doc) => this.toRoom(doc as unknown as RoomDocument, userId)),
      meta: result.meta,
    };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    const doc = await this.findRoomForParticipant(id, userId);
    return this.toRoom(doc, userId);
  }

  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }

    const doc = await this.roomModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Room not found');
    }

    if (doc.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }

    if (doc.status === 'drawn') {
      throw new BadRequestException('Cannot join a room after the draw has been done');
    }

    const alreadyIn = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (alreadyIn) {
      return this.toRoom(doc, userId);
    }

    doc.participants.push({ userId: new Types.ObjectId(userId), role: 'member' });
    await doc.save();

    return this.toRoom(doc, userId);
  }

  joinByCode(inviteCode: string, userId: string): Promise<Room> {
    throw new Error('RoomsService.joinByCode is not implemented — see Lesson 05');
  }

  draw(id: string, requesterId: string, exchangeDate: string): Promise<Room> {
    throw new Error('RoomsService.draw is not implemented — see Lesson 03');
  }

  getAssignment(id: string, userId: string): Promise<AssignmentView> {
    throw new Error('RoomsService.getAssignment is not implemented — see Lesson 03');
  }

  editRoom(id: string, dto: UpdateRoomDto, userId: string): Promise<Room> {
    throw new Error('RoomsService.editRoom is not implemented — see Lesson 04');
  }

  deleteRoom(id: string, userId: string): Promise<void> {
    throw new Error('RoomsService.deleteRoom is not implemented — see Lesson 04');
  }

  kickMember(id: string, targetUserId: string, userId: string): Promise<void> {
    throw new Error('RoomsService.kickMember is not implemented — see Lesson 04');
  }

  regenerateInviteCode(id: string, userId: string): Promise<Room> {
    throw new Error('RoomsService.regenerateInviteCode is not implemented — see Lesson 04');
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async findRoomForParticipant(id: string, userId: string): Promise<RoomDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }
    const doc = await this.roomModel.findById(id).exec();
    const isParticipant = doc?.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!doc || !isParticipant) {
      throw new NotFoundException('Room not found');
    }
    return doc;
  }

  private toRoom(doc: RoomDocument, viewerId: string): Room {
    const viewerParticipant = doc.participants.find(
      (p) => p.userId.toString() === viewerId,
    );

    return {
      id: doc._id.toString(),
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      inviteCode: doc.inviteCode,
      participants: doc.participants.map((p) => ({
        id: p.userId.toString(),
        displayName: p.userId.toString(), // populated in later lessons
        role: p.role,
      })),
      participantCount: doc.participants.length,
      status: doc.status,
      drawDate: doc.drawDate?.toISOString(),
      budget: doc.budget,
      currency: doc.currency,
      exchangeDate: doc.exchangeDate?.toISOString(),
      viewerPermissions: viewerParticipant
        ? [...permissionsForRole(viewerParticipant.role)]
        : [],
    };
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
