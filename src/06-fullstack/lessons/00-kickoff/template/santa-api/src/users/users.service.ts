import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { User } from './user.types';
import { User as UserModel, UserDocument } from './schemas/user.schema';

type CreateUserInput = {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: 'user' | 'admin';
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserModel>,
  ) {}

  // TODO (Kickoff / Auth): persist a new user (lower-case the email, default role 'user').
  create(input: CreateUserInput): Promise<User> {
    throw new NotImplementedException('UsersService.create is not implemented');
  }

  // TODO (Kickoff / Auth): find a user by email. When opts.withPassword is set,
  // select('+passwordHash') so login can compare it. Returns the raw document or null.
  findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserDocument | null> {
    throw new NotImplementedException(
      'UsersService.findByEmail is not implemented',
    );
  }

  // TODO (Profile): find a user by id; throw NotFoundException if missing or id invalid.
  findById(id: string): Promise<User> {
    throw new NotImplementedException(
      'UsersService.findById is not implemented',
    );
  }

  // TODO (Profile): update the current user's displayName and return the fresh user.
  updateCurrentUser(id: string, dto: UpdateCurrentUserDto): Promise<User> {
    throw new NotImplementedException(
      'UsersService.updateCurrentUser is not implemented',
    );
  }
}
