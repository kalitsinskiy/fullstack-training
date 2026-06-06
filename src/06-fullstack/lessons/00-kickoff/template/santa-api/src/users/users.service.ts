import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async create({
    email,
    displayName,
    passwordHash,
    role,
  }: CreateUserInput): Promise<User> {
    const user = await this.userModel.create({
      email: email.toLowerCase(),
      displayName,
      passwordHash,
      role: role ?? 'user',
    });

    return this.toUser(user);
  }

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

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.toUser(user);
  }

  async updateCurrentUser(
    id: string,
    { displayName }: UpdateCurrentUserDto,
  ): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...(displayName ? { displayName } : {}),
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.toUser(user);
  }

  private toUser(user: {
    _id: Types.ObjectId;
    displayName: string;
    email: string;
    role: 'user' | 'admin';
  }): User {
    return {
      id: user._id.toString(),
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    };
  }
}
