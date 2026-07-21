import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RedisService } from '../common/redis/redis.service';
import {
  paginate,
  PaginatedResponse,
  PaginationQuery,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AssignmentView, Room, RoomParticipant } from './room.types';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';
import { permissionsForRole } from './permissions';
import { EventPublisherService } from 'src/events/eventPublisher.service';

const ROOM_TTL = 300; // 5 minutes
const INVITE_TTL = 48 * 60 * 60; // 48 hours

function sattoloCycle<T>(arr: T[]): T[] {
  const result = [...arr];
  let i = result.length;
  while (i > 1) {
    i--;
    const j = Math.floor(Math.random() * i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
    private readonly redisService: RedisService,
    private readonly eventPublisherService: EventPublisherService,
  ) {}

  private async toRoomView(doc: RoomDocument, viewerId: string): Promise<Room> {
    const participants: RoomParticipant[] = await Promise.all(
      doc.participants.map(async (p) => {
        const user = await this.usersService
          .findById(p.userId.toString())
          .catch(() => null);
        return {
          id: p.userId.toString(),
          displayName: user?.displayName ?? 'Unknown',
          role: p.role,
        };
      }),
    );

    const viewerEntry = doc.participants.find(
      (p) => p.userId.toString() === viewerId,
    );
    const viewerPermissions = viewerEntry
      ? permissionsForRole(viewerEntry.role)
      : [];

    return {
      id: doc.id,
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
    const code = this.generateCode();
    const doc = await this.roomModel.create({
      name: dto.name,
      creatorId: new Types.ObjectId(creatorId),
      inviteCode: code,
      participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
      status: 'pending',
      ...(dto.budget !== undefined && { budget: dto.budget }),
      ...(dto.currency && { currency: dto.currency }),
    });
    await this.redisService.set(`invite:${code}`, doc.id, INVITE_TTL);
    await this.eventPublisherService.publish('room.created', {
      roomId: doc._id,
      roomName: doc.name,
      createdBy: await this.getDisplayName(creatorId),
    });
    return this.toRoomView(doc, creatorId);
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const filter = { 'participants.userId': new Types.ObjectId(userId) };
    const result = await paginate(this.roomModel, filter, query);
    const data = await Promise.all(
      result.data.map((doc) =>
        this.toRoomView(doc as unknown as RoomDocument, userId),
      ),
    );
    return { data, meta: result.meta };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');

    const cacheKey = `room:${id}`;
    const cached = await this.redisService.get(cacheKey);
    let doc: RoomDocument;

    if (cached) {
      this.logger.debug(`Room cache HIT: ${cacheKey}`);
      doc = JSON.parse(cached) as RoomDocument;
      const isMember = doc.participants.some(
        (p) => p.userId.toString() === userId,
      );
      if (!isMember) throw new NotFoundException('Room not found');
    } else {
      this.logger.debug(`Room cache MISS: ${cacheKey}`);
      const found = await this.roomModel
        .findOne({
          _id: id,
          'participants.userId': new Types.ObjectId(userId),
        })
        .exec();
      if (!found) throw new NotFoundException('Room not found');
      doc = found;
      await this.redisService.set(cacheKey, JSON.stringify(doc), ROOM_TTL);
    }

    return this.toRoomView(doc, userId);
  }

  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');
    if (doc.inviteCode !== inviteCode)
      throw new BadRequestException('Invalid invite code');
    if (doc.status === 'drawn')
      throw new BadRequestException('Draw already completed');
    const alreadyMember = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!alreadyMember) {
      doc.participants.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
      });
      await doc.save();
      await this.redisService.del(`room:${id}`);
    }

    await this.eventPublisherService.publish('user.joined', {
      roomId: id,
      userId,
      userName: await this.getDisplayName(userId),
    });

    return this.toRoomView(doc, userId);
  }

  async joinByCode(inviteCode: string, userId: string): Promise<Room> {
    const roomId = await this.redisService.get(`invite:${inviteCode}`);
    if (!roomId)
      throw new BadRequestException('Invalid or expired invite code');
    const doc = await this.roomModel.findById(roomId).exec();
    if (!doc) throw new NotFoundException('Room not found');
    if (doc.status === 'drawn')
      throw new BadRequestException('Draw already completed');
    const alreadyMember = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!alreadyMember) {
      doc.participants.push({
        userId: new Types.ObjectId(userId),
        role: 'member',
      });
      await doc.save();
      await this.redisService.del(`room:${roomId}`);
    }
    return this.toRoomView(doc, userId);
  }

  async draw(
    id: string,
    requesterId: string,
    exchangeDate: string,
  ): Promise<Room> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');

    if (doc.status === 'drawn') {
      throw new BadRequestException('Draw has already been performed');
    }
    if (doc.participants.length < 3) {
      throw new BadRequestException('Need at least 3 participants to draw');
    }

    const participantIds = doc.participants.map((p) => p.userId.toString());
    const shuffled = sattoloCycle(participantIds);
    const assignments = participantIds.map((giverId, i) => ({
      giverId: new Types.ObjectId(giverId),
      receiverId: new Types.ObjectId(shuffled[i]),
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

    await this.redisService.del(`room:${id}`);
    await this.eventPublisherService.publish('draw.completed', {
      roomId: id,
      participantIds: doc.participants.map((p) => p.userId.toString()),
    });
    return this.toRoomView(updated as unknown as RoomDocument, requesterId);
  }

  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');

    if (doc.status !== 'drawn') {
      throw new BadRequestException('Draw has not been performed yet');
    }

    const isMember = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!isMember) throw new ForbiddenException('Not a room participant');

    const assignment = doc.assignments.find(
      (a) => a.giverId.toString() === userId,
    );
    if (!assignment) throw new NotFoundException('Assignment not found');

    const receiver = await this.usersService.findById(
      assignment.receiverId.toString(),
    );
    const wishlist = await this.wishlistService.get(
      id,
      assignment.receiverId.toString(),
    );

    return {
      receiver: {
        id: receiver.id,
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
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');

    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.budget !== undefined) update.budget = dto.budget;
    if (dto.currency !== undefined) update.currency = dto.currency;
    if (dto.exchangeDate !== undefined)
      update.exchangeDate = new Date(dto.exchangeDate);

    const updated = await this.roomModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    await this.redisService.del(`room:${id}`);
    return this.toRoomView(updated as unknown as RoomDocument, userId);
  }

  async deleteRoom(id: string, _userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');
    await this.roomModel.findByIdAndDelete(id).exec();
    await this.redisService.del(`room:${id}`);
  }

  async kickMember(
    id: string,
    targetUserId: string,
    _userId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');
    const target = doc.participants.find(
      (p) => p.userId.toString() === targetUserId,
    );
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') {
      throw new BadRequestException('Cannot remove the owner');
    }
    doc.participants = doc.participants.filter(
      (p) => p.userId.toString() !== targetUserId,
    );
    await doc.save();
    await this.redisService.del(`room:${id}`);
  }

  async regenerateInviteCode(id: string, userId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Room not found');
    const doc = await this.roomModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Room not found');
    const oldCode = doc.inviteCode;
    const code = this.generateCode();
    const updated = await this.roomModel
      .findByIdAndUpdate(id, { inviteCode: code }, { new: true })
      .exec();
    await Promise.all([
      this.redisService.del(`invite:${oldCode}`),
      this.redisService.set(`invite:${code}`, id, INVITE_TTL),
      this.redisService.del(`room:${id}`),
    ]);
    return this.toRoomView(updated as unknown as RoomDocument, userId);
  }

  private generateCode(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  private async getDisplayName(id: string): Promise<string> {
    const user = await this.usersService.findById(id).catch(() => null);

    return user?.displayName || 'Unknown';
  }
}
