import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  paginate,
  PaginationQuery,
  PaginatedResponse,
} from '../common/pagination';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
  ) {}

  async create(dto: CreateRoomDto, ownerId: string) {
    const inviteCode = await this.generateUniqueCode();
    return this.roomModel.create({
      name: dto.name,
      creatorId: ownerId,
      inviteCode,
      participants: [ownerId],
    });
  }

  findAll() {
    return this.roomModel.find().exec();
  }

  findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    return paginate(this.roomModel, { participants: userId }, query);
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.roomModel.findById(id).exec();
  }

  findByCode(code: string) {
    return this.roomModel.findOne({ inviteCode: code }).exec();
  }

  async join(code: string, userId: string): Promise<Room> {
    const room = await this.roomModel.findOne({ inviteCode: code }).exec();
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'drawn') {
      throw new ForbiddenException(
        'Cannot join a room that has already been drawn',
      );
    }
    return this.roomModel
      .findOneAndUpdate(
        { inviteCode: code },
        { $addToSet: { participants: userId } },
        { new: true },
      )
      .exec() as Promise<Room>;
  }

  async getAssignment(
    roomId: string,
    userId: string,
  ): Promise<{ assigneeId: string; assigneeName: string }> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    const isMember = room.participants.some((p) => p.toString() === userId);
    if (!isMember) throw new ForbiddenException('Access denied');

    if (room.status !== 'drawn' || !room.assignments) {
      throw new NotFoundException('Draw has not been run yet');
    }

    const assigneeId = room.assignments.get(userId);
    if (!assigneeId) throw new NotFoundException('Assignment not found');

    const assignee = await this.usersService.findById(assigneeId);
    if (!assignee) throw new NotFoundException('Assignee not found');

    return { assigneeId, assigneeName: assignee.displayName };
  }

  async getAssignmentWishlist(
    roomId: string,
    userId: string,
  ): Promise<{
    assigneeName: string;
    items: Array<{ name: string; url?: string; priority?: number }>;
  }> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    const isMember = room.participants.some((p) => p.toString() === userId);
    if (!isMember) throw new ForbiddenException('Access denied');

    if (room.status !== 'drawn' || !room.assignments) {
      throw new NotFoundException('Draw has not been run yet');
    }

    const assigneeId = room.assignments.get(userId);
    if (!assigneeId) throw new NotFoundException('Assignment not found');

    const [assignee, wishlist] = await Promise.all([
      this.usersService.findById(assigneeId),
      this.wishlistService.get(roomId, assigneeId),
    ]);

    if (!assignee) throw new NotFoundException('Assignee not found');

    return {
      assigneeName: assignee.displayName,
      items: wishlist?.items ?? [],
    };
  }

  async draw(roomId: string, callerId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');
    if (room.creatorId.toString() !== callerId) {
      throw new ForbiddenException('Only the room owner can run the draw');
    }
    if (room.status === 'drawn') {
      throw new BadRequestException('Room is already drawn');
    }
    if (room.participants.length < 3) {
      throw new BadRequestException('Need at least 3 participants to draw');
    }

    const ids = room.participants.map((p) => p.toString());
    const assignments = this.makeDraw(ids);

    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        { status: 'drawn', drawDate: new Date(), assignments },
        { new: true },
      )
      .exec() as Promise<Room>;
  }

  private async generateUniqueCode(): Promise<string> {
    while (true) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      if (code.length !== 6) continue;
      const exists = await this.roomModel.exists({ inviteCode: code });
      if (!exists) return code;
    }
  }

  private makeDraw(ids: string[]): Map<string, string> {
    // Shuffle, then chain each giver to the next person in shuffled order —
    // guarantees a single cycle, so nobody draws themselves and nobody ends
    // up in a mutual pair (A -> B and B -> A).
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const assignments = new Map<string, string>();
    for (let i = 0; i < shuffled.length; i++) {
      assignments.set(shuffled[i], shuffled[(i + 1) % shuffled.length]);
    }
    return assignments;
  }
}
