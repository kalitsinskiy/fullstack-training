import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
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

  private toUser(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      displayName: doc.displayName,
      email: doc.email,
      role: doc.role,
    };
  }

  // Persist a new user (lower-case the email, default role 'user').
  async create(input: CreateUserInput): Promise<User> {
    const doc = await this.userModel.create({
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
    });
    return this.toUser(doc);
  }

  // Find a user by email. When opts.withPassword is set, select('+passwordHash').
  findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (opts.withPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  // Find a user by id; throw NotFoundException if missing or id invalid.
  async findById(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('User not found');
    }
    const doc = await this.userModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return this.toUser(doc);
  }

  // Update the current user's displayName and return the fresh user.
  async updateCurrentUser(
    id: string,
    dto: UpdateCurrentUserDto,
  ): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('User not found');
    }
    const doc = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...(dto.displayName !== undefined && {
            displayName: dto.displayName,
          }),
        },
        { new: true },
      )
      .exec();
    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return this.toUser(doc);
  }
}
