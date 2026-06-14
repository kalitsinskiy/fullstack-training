import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { PaginatedResponse, PaginationQuery } from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { AssignmentView, Room } from './room.types';
import { Room as RoomModel } from './schemas/room.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(RoomModel.name)
    private readonly roomModel: Model<RoomModel>,
    private readonly usersService: UsersService,
    private readonly wishlistService: WishlistService,
  ) {}

  // TODO (Kickoff): create a room with a unique invite code; the creator is the
  // first participant. Status starts as 'pending'.
  create(dto: CreateRoomDto, creatorId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.create is not implemented');
  }

  // TODO (Kickoff): list rooms where the user is a participant (paginated).
  findByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    throw new NotImplementedException(
      'RoomsService.findByUser is not implemented',
    );
  }

  // TODO (Kickoff): return a room by id (no membership check).
  findById(id: string): Promise<Room> {
    throw new NotImplementedException(
      'RoomsService.findById is not implemented',
    );
  }

  // TODO (Kickoff): return a room by id, but only if the user is a participant.
  findByIdForUser(id: string, userId: string): Promise<Room> {
    throw new NotImplementedException(
      'RoomsService.findByIdForUser is not implemented',
    );
  }

  // TODO (Kickoff): join a room by id, authorised by the invite code in the body.
  // Reject a wrong code, and a room whose draw is already done.
  join(id: string, inviteCode: string, userId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.join is not implemented');
  }

  // TODO (Lesson 03): only the creator may draw, and only once, with >= 3 participants.
  // Produce a derangement (Sattolo / Fisher–Yates with rejection — no self-assignment)
  // and persist ALL assignments in a single document write (atomic, no transaction).
  draw(id: string, requesterId: string): Promise<Room> {
    throw new NotImplementedException('RoomsService.draw is not implemented');
  }

  // TODO (Lesson 03): return the giftee assigned to this user, plus their wishlist.
  // Only a participant of a drawn room may read it.
  getAssignment(id: string, userId: string): Promise<AssignmentView> {
    throw new NotImplementedException(
      'RoomsService.getAssignment is not implemented',
    );
  }
}
