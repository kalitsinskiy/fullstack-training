import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RedisService } from '../redis/redis.service';
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
import { sattoloCycle } from '../utils/derangement';

const ROOM_CACHE_TTL = 300;
const INVITE_CODE_TTL = 48 * 60 * 60;

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    const inviteCode = this.generateInviteCode();

    try {
      const doc = await this.roomModel.create({
        name: dto.name.trim(),
        creatorId: new Types.ObjectId(creatorId),
        inviteCode,
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        status: 'pending',
        budget: dto.budget,
        currency: dto.currency,
      });

      await this.redisService.set(
        `invite:${inviteCode}`,
        doc._id.toString(),
        INVITE_CODE_TTL,
      );

      const displayNames = await this.resolveDisplayNames(doc);
      return this.toRoom(doc, creatorId, displayNames);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 11000
      ) {
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
    const rooms = await Promise.all(
      result.data.map(async (doc) => {
        const d = doc as unknown as RoomDocument;
        const displayNames = await this.resolveDisplayNames(d);
        return this.toRoom(d, userId, displayNames);
      }),
    );
    return { data: rooms, meta: result.meta };
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    const cacheKey = `room:${id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      this.logger.debug(`Room cache HIT: ${cacheKey}`);
      const room = JSON.parse(cached) as Room;
      const viewer = room.participants.find((p) => p.id === userId);
      if (!viewer) throw new NotFoundException('Room not found');
      return { ...room, viewerPermissions: [...permissionsForRole(viewer.role)] };
    }

    this.logger.debug(`Room cache MISS: ${cacheKey}`);
    const doc = await this.findRoomForParticipant(id, userId);
    const displayNames = await this.resolveDisplayNames(doc);
    const room = this.toRoom(doc, userId, displayNames);

    const { viewerPermissions: _, ...cacheable } = room;
    await this.redisService.set(cacheKey, JSON.stringify(cacheable), ROOM_CACHE_TTL);

    return room;
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
      throw new BadRequestException(
        'Cannot join a room after the draw has been done',
      );
    }

    const alreadyIn = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (alreadyIn) {
      const displayNames = await this.resolveDisplayNames(doc);
      return this.toRoom(doc, userId, displayNames);
    }

    doc.participants.push({
      userId: new Types.ObjectId(userId),
      role: 'member',
    });
    await doc.save();
    await this.redisService.del(`room:${id}`);

    const displayNames = await this.resolveDisplayNames(doc);
    return this.toRoom(doc, userId, displayNames);
  }

  async joinByCode(inviteCode: string, userId: string): Promise<Room> {
    const roomId = await this.redisService.get(`invite:${inviteCode}`);
    if (!roomId) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    const doc = await this.roomModel.findById(roomId).exec();
    if (!doc) {
      throw new BadRequestException('Invalid or expired invite code');
    }

    if (doc.status === 'drawn') {
      throw new BadRequestException(
        'Cannot join a room after the draw has been done',
      );
    }

    const alreadyIn = doc.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (alreadyIn) {
      const displayNames = await this.resolveDisplayNames(doc);
      return this.toRoom(doc, userId, displayNames);
    }

    doc.participants.push({
      userId: new Types.ObjectId(userId),
      role: 'member',
    });
    await doc.save();
    await this.redisService.del(`room:${roomId}`);

    const displayNames = await this.resolveDisplayNames(doc);
    return this.toRoom(doc, userId, displayNames);
  }

  async draw(
    id: string,
    requesterId: string,
    exchangeDate: string,
  ): Promise<Room> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Room not found');
    }

    const doc = await this.roomModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Room not found');
    }

    if (doc.creatorId.toString() !== requesterId) {
      throw new ForbiddenException(
        'Only the room creator can trigger the draw',
      );
    }

    if (doc.status === 'drawn') {
      throw new BadRequestException('Draw has already been performed');
    }

    if (doc.participants.length < 3) {
      throw new BadRequestException('Need at least 3 participants to draw');
    }

    const participantIds = doc.participants.map((p) => p.userId);
    const shuffled = sattoloCycle(participantIds);

    const assignments = participantIds.map((giverId, index) => ({
      giverId,
      receiverId: shuffled[index],
    }));

    const updatedDoc = await this.roomModel
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

    if (!updatedDoc) {
      throw new NotFoundException('Room not found');
    }

    await this.redisService.del(`room:${id}`);

    const displayNames = await this.resolveDisplayNames(updatedDoc);
    return this.toRoom(updatedDoc, requesterId, displayNames);
  }

  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    const doc = await this.findRoomForParticipant(id, userId);

    if (doc.status !== 'drawn') {
      throw new BadRequestException('Draw has not been completed yet');
    }

    const assignment = doc.assignments.find(
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
    const doc = await this.findRoomForParticipant(id, userId);

    if (dto.name !== undefined) doc.name = dto.name.trim();
    if (dto.budget !== undefined) doc.budget = dto.budget;
    if (dto.currency !== undefined) doc.currency = dto.currency;
    if (dto.exchangeDate !== undefined)
      doc.exchangeDate = new Date(dto.exchangeDate);

    await doc.save();
    await this.redisService.del(`room:${id}`);
    const displayNames = await this.resolveDisplayNames(doc);
    return this.toRoom(doc, userId, displayNames);
  }

  async deleteRoom(id: string, userId: string): Promise<void> {
    const doc = await this.findRoomForParticipant(id, userId);
    await doc.deleteOne();
    await this.redisService.del(`room:${id}`);
  }

  async kickMember(
    id: string,
    targetUserId: string,
    userId: string,
  ): Promise<void> {
    const doc = await this.findRoomForParticipant(id, userId);

    const target = doc.participants.find(
      (p) => p.userId.toString() === targetUserId,
    );
    if (!target) {
      throw new NotFoundException('Member not found');
    }
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
    const doc = await this.findRoomForParticipant(id, userId);
    const newCode = this.generateInviteCode();
    await this.redisService.del(`invite:${doc.inviteCode}`);
    doc.inviteCode = newCode;
    await doc.save();
    await this.redisService.set(`invite:${newCode}`, id, INVITE_CODE_TTL);
    await this.redisService.del(`room:${id}`);
    const displayNames = await this.resolveDisplayNames(doc);
    return this.toRoom(doc, userId, displayNames);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async findRoomForParticipant(
    id: string,
    userId: string,
  ): Promise<RoomDocument> {
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

  private toRoom(
    doc: RoomDocument,
    viewerId: string,
    displayNames: Record<string, string> = {},
  ): Room {
    const viewerParticipant = doc.participants.find(
      (p) => p.userId.toString() === viewerId,
    );

    return {
      id: doc._id.toString(),
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      inviteCode: doc.inviteCode,
      participants: doc.participants.map((p) => {
        const uid = p.userId.toString();
        return {
          id: uid,
          displayName: displayNames[uid] ?? uid,
          role: p.role,
        };
      }),
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

  private async resolveDisplayNames(
    doc: RoomDocument,
  ): Promise<Record<string, string>> {
    const users = await Promise.all(
      doc.participants.map((p) =>
        this.usersService.findById(p.userId.toString()),
      ),
    );
    return Object.fromEntries(users.map((u) => [u.id, u.displayName]));
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
