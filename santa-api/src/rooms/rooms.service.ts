import {
  BadRequestException,
  Injectable,
  NotImplementedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { paginate, PaginatedResponse, PaginationQuery } from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignmentView, Room, RoomParticipant } from './room.types';
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

  private async toRoomView(doc: RoomDocument, viewerId: string): Promise<Room> {
    const participants: RoomParticipant[] = await Promise.all(
      doc.participants.map(async (p) => {
        const user = await this.usersService.findById(p.userId.toString()).catch(() => null);
        return {
          id: p.userId.toString(),
          displayName: user?.displayName ?? 'Unknown',
          role: p.role,
        };
      }),
    );

    const viewerEntry = doc.participants.find(p => p.userId.toString() === viewerId);
    const viewerPermissions = viewerEntry ? permissionsForRole(viewerEntry.role) : [];

    return {
      id: doc.id as string,
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      inviteCode: doc.inviteCode,
      participants,
      participantCount: participants.length,
      status: doc.status,
      ...(doc.drawDate && { drawDate: doc.drawDate.toISOString() }),
      ...(doc.budget !== undefined && { budget: doc.budget }),
      ...(doc.currency && { currency: doc.currency }),
      ...(doc.exchangeDate && { exchangeDate: doc.exchangeDate.toISOString() }),
      viewerPermissions: [...viewerPermissions],
    };
  }

  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const doc = await this.roomModel.create({
      name: dto.name,
      creatorId: new Types.ObjectId(creatorId),
      inviteCode: code,
      participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
      status: 'pending',
      ...(dto.budget !== undefined && { budget: dto.budget }),
      ...(dto.currency && { currency: dto.currency }),
    });
    return this.toRoomView(doc as unknown as RoomDocument, creatorId);
  }

  async findByUser(userId: string, query: PaginationQuery): Promise<PaginatedResponse<Room>> {
    const filter = { 'participants.userId': new Types.ObjectId(userId) };
    const result = await paginate(this.roomModel, filter, query);
    const data = await Promise.all(
      result.data.map(doc => this.toRoomView(doc as unknown as RoomDocument, userId)),
    );
    return { data, meta: result.meta };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findOne({
      _id: id,
      'participants.userId': new Types.ObjectId(userId),
    }).exec();
    if (!doc) throw new NotFoundException('Room not found');
    return this.toRoomView(doc as unknown as RoomDocument, userId);
  }

  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');
    if (doc.inviteCode !== inviteCode) throw new BadRequestException('Invalid invite code');
    if (doc.status === 'drawn') throw new BadRequestException('Draw already completed');
    const alreadyMember = doc.participants.some(p => p.userId.toString() === userId);
    if (!alreadyMember) {
      doc.participants.push({ userId: new Types.ObjectId(userId), role: 'member' });
      await doc.save();
    }
    return this.toRoomView(doc as unknown as RoomDocument, userId);
  }

  joinByCode(inviteCode: string, userId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.joinByCode is not implemented');
  }

  draw(id: string, requesterId: string, exchangeDate: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.draw is not implemented');
  }

  getAssignment(id: string, userId: string): Promise<AssignmentView> {
    throw new NotImplementedException('RoomsService.getAssignment is not implemented');
  }

  editRoom(id: string, dto: UpdateRoomDto, userId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.editRoom is not implemented');
  }

  deleteRoom(id: string, userId: string): Promise<void> {
    throw new NotImplementedException('RoomsService.deleteRoom is not implemented');
  }

  kickMember(id: string, targetUserId: string, userId: string): Promise<void> {
    throw new NotImplementedException('RoomsService.kickMember is not implemented');
  }

  regenerateInviteCode(id: string, userId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.regenerateInviteCode is not implemented');
  }
}
