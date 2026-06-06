import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import {
  paginate,
  PaginatedResponse,
  PaginationQuery,
} from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel, RoomDocument } from './schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
  ) {}

  async create({ name }: CreateRoomDto, creatorId: string): Promise<Room> {
    await this.usersService.findById(creatorId);

    const room = await this.roomModel.create({
      name,
      creatorId,
      inviteCode: await this.generateCode(),
      participants: [creatorId],
      status: 'pending',
    });

    return this.toRoom(room);
  }

  async findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const result = await paginate(
      this.roomModel,
      { participants: userId },
      query,
    );

    return {
      data: result.data.map((room) => this.toRoom(room as RoomDocument)),
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<Room> {
    const room = await this.findRoomDocumentById(id);

    return this.toRoom(room);
  }

  async findByIdForUser(id: string, userId: string): Promise<Room> {
    const room = await this.findRoomDocumentById(id);

    this.assertParticipant(room, userId);

    return this.toRoom(room);
  }

  /**
   * Join a room by its id, authorised by the invite code in the body.
   * Matches POST /api/rooms/:id/join { inviteCode }.
   */
  async join(id: string, inviteCode: string, userId: string): Promise<Room> {
    await this.usersService.findById(userId);

    const existingRoom = await this.findRoomDocumentById(id);

    if (existingRoom.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code for this room');
    }

    if (existingRoom.status === 'drawn') {
      throw new ForbiddenException('Room draw has already been completed');
    }

    const room = await this.roomModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { participants: new Types.ObjectId(userId) } },
        { new: true },
      )
      .exec();

    if (!room) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    return this.toRoom(room);
  }

  /**
   * Run the draw for a room. Only the creator may trigger it.
   * Produces a derangement (no participant is assigned to themselves).
   */
  async draw(id: string, requesterId: string): Promise<Room> {
    const room = await this.findRoomDocumentById(id);

    if (room.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Only the room creator can run the draw');
    }

    if (room.status === 'drawn') {
      throw new BadRequestException('Room draw has already been completed');
    }

    if (room.participants.length < 3) {
      throw new BadRequestException(
        'At least 3 participants are required to draw',
      );
    }

    const assignments = this.buildAssignments(room.participants);
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        { status: 'drawn', drawDate: new Date(), assignments },
        { new: true },
      )
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    return this.toRoom(updatedRoom);
  }

  /** Return the giftee assigned to the current user, with their wishlist. */
  async getAssignment(id: string, userId: string): Promise<AssignmentView> {
    const room = await this.findRoomDocumentById(id);

    this.assertParticipant(room, userId);

    if (room.status !== 'drawn') {
      throw new BadRequestException('The draw has not been completed yet');
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
        id: receiver.id,
        displayName: receiver.displayName,
        wishlist: wishlist?.items ?? [],
      },
    };
  }

  private async generateCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    while (true) {
      const inviteCode = Array.from({ length: 6 }, () => {
        const index = Math.floor(Math.random() * alphabet.length);
        return alphabet[index];
      }).join('');

      const existingRoom = await this.roomModel
        .findOne({ inviteCode })
        .select('_id')
        .lean()
        .exec();

      if (!existingRoom) {
        return inviteCode;
      }
    }
  }

  private assertParticipant(room: RoomDocument, userId: string): void {
    const isParticipant = room.participants.some(
      (participant) => participant.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        `Room ${room._id.toString()} is not accessible`,
      );
    }
  }

  private async findRoomDocumentById(id: string): Promise<RoomDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    const room = await this.roomModel.findById(id).exec();

    if (!room) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    return room;
  }

  private buildAssignments(
    participants: Types.ObjectId[],
  ): Array<{ giverId: Types.ObjectId; receiverId: Types.ObjectId }> {
    const shuffledParticipants = [...participants];

    for (let index = shuffledParticipants.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const currentParticipant = shuffledParticipants[index];

      shuffledParticipants[index] = shuffledParticipants[swapIndex];
      shuffledParticipants[swapIndex] = currentParticipant;
    }

    const hasSelfAssignment = shuffledParticipants.some((participant, index) =>
      participant.equals(participants[index]),
    );

    if (hasSelfAssignment) {
      // A single rotation is always a derangement (no fixed points).
      const rotatedParticipants = [...participants.slice(1), participants[0]];

      return participants.map((participant, index) => ({
        giverId: participant,
        receiverId: rotatedParticipants[index],
      }));
    }

    return participants.map((participant, index) => ({
      giverId: participant,
      receiverId: shuffledParticipants[index],
    }));
  }

  private toRoom(room: RoomDocument): Room {
    return {
      id: room._id.toString(),
      name: room.name,
      creatorId: room.creatorId.toString(),
      inviteCode: room.inviteCode,
      participants: room.participants.map((participant) =>
        participant.toString(),
      ),
      participantCount: room.participants.length,
      status: room.status,
      drawDate: room.drawDate?.toISOString(),
    };
  }
}
