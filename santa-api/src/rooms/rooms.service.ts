import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room as RoomSchemaClass, RoomDocument } from './schemas/room.schema';
import {
  paginate,
  PaginationQuery,
  PaginatedResponse,
} from '../common/pagination';

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  code: string;
  members: string[];
  status: 'pending' | 'drawn' | 'closed';
  drawDate?: Date;
  exchangeDate?: Date;
  exchangePlace?: string;
  assignments?: Record<string, string>;
  createdAt: Date;
}

export interface CreateRoomInput {
  name: string;
  ownerId: string;
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(RoomSchemaClass.name)
    private readonly roomModel: Model<RoomDocument>,
  ) {}

  async create(input: CreateRoomInput): Promise<Room> {
    const inviteCode = await this.generateUniqueCode();
    const doc = await this.roomModel.create({
      name: input.name,
      creatorId: input.ownerId,
      inviteCode,
      participants: [input.ownerId],
    });
    return this.toPublic(doc);
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const res = await paginate(this.roomModel, { participants: userId }, query);
    return {
      data: res.data.map((doc) => this.toPublic(doc as RoomDocument)),
      meta: res.meta,
    };
  }

  async findById(id: string): Promise<Room | undefined> {
    if (!Types.ObjectId.isValid(id)) return undefined;
    const doc = await this.roomModel.findById(id);
    return doc ? this.toPublic(doc) : undefined;
  }

  async findByCode(code: string): Promise<Room | undefined> {
    const doc = await this.roomModel.findOne({ inviteCode: code });
    return doc ? this.toPublic(doc) : undefined;
  }

  async addMember(code: string, userId: string): Promise<Room | undefined> {
    const existing = await this.roomModel.findOne({ inviteCode: code });

    if (!existing) return undefined;
    if (existing.status === 'drawn') {
      throw new ForbiddenException('Room is already drawn');
    }

    const doc = await this.roomModel.findOneAndUpdate(
      { inviteCode: code },
      { $addToSet: { participants: userId } },
      { new: true },
    );
    return doc ? this.toPublic(doc) : undefined;
  }

  async draw(roomId: string, callerId: string): Promise<Room> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const doc = await this.roomModel.findById(roomId);

    if (!doc) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (doc.creatorId !== callerId) {
      throw new ForbiddenException('Only the room owner can run the draw');
    }
    if (doc.status === 'drawn') {
      throw new BadRequestException('Room is already drawn');
    }
    if (doc.participants.length < 3) {
      throw new BadRequestException(
        'Need at least 3 participants to run the draw',
      );
    }

    doc.assignments = this.makeDraw(doc.participants);
    doc.status = 'drawn';
    doc.drawDate = new Date();
    await doc.save();

    return this.toPublic(doc);
  }

  async setExchange(
    roomId: string,
    callerId: string,
    input: { exchangeDate: string; exchangePlace: string },
  ): Promise<Room> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const doc = await this.roomModel.findById(roomId);

    if (!doc) throw new NotFoundException(`Room ${roomId} not found`);
    if (doc.creatorId !== callerId)
      throw new ForbiddenException(
        'Only the room owner can schedule the exchange',
      );

    const effective = this.toPublic(doc).status;

    if (effective === 'pending') {
      throw new BadRequestException(
        'Run the draw before scheduling the exchange',
      );
    }

    if (effective === 'closed') {
      throw new ForbiddenException(
        'Room is closed — the exchange date has passed',
      );
    }

    doc.exchangeDate = new Date(input.exchangeDate);
    doc.exchangePlace = input.exchangePlace;
    await doc.save();

    return this.toPublic(doc);
  }

  async remove(roomId: string, callerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(roomId))
      throw new NotFoundException(`Room ${roomId} not found`);

    const doc = await this.roomModel.findById(roomId);

    if (!doc) throw new NotFoundException(`Room ${roomId} not found`);
    if (doc.creatorId !== callerId)
      throw new ForbiddenException('Only the room owner can delete the room');

    await doc.deleteOne();
  }

  private async generateUniqueCode(): Promise<string> {
    while (true) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      if (code.length !== 6) continue;
      const exists = await this.roomModel.exists({ inviteCode: code });
      if (!exists) return code;
    }
  }

  private makeDraw(participants: string[]): Record<string, string> {
    // Fisher–Yates shuffle - O(n)
    while (true) {
      const shuffled = [...participants];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const hasFixedPoint = participants.some((p, i) => p === shuffled[i]);

      if (hasFixedPoint) continue;

      const res: Record<string, string> = {};

      for (let i = 0; i < participants.length; i++) {
        res[participants[i]] = shuffled[i];
      }

      return res;
    }
  }

  private toPublic(doc: RoomDocument): Room {
    const isClosed =
      doc.status === 'drawn' &&
      !!doc.exchangeDate &&
      doc.exchangeDate.getTime() <= Date.now();

    return {
      id: doc._id.toString(),
      name: doc.name,
      ownerId: doc.creatorId,
      code: doc.inviteCode,
      members: doc.participants,
      status: isClosed ? 'closed' : doc.status,
      drawDate: doc.drawDate,
      exchangeDate: doc.exchangeDate,
      exchangePlace: doc.exchangePlace,
      assignments: doc.assignments,
      createdAt: doc.get('createdAt') as Date,
    };
  }
}
