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

  async create(input: CreateUserInput): Promise<User> {
    const doc = await this.userModel.create({
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
    });
    return {
      id: doc.id,
      email: doc.email,
      displayName: doc.displayName,
      role: doc.role,
    };
  }

  async findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({
      email: { $eq: email.toLowerCase() },
    });
    if (opts.withPassword) query.select('+passwordHash');
    return query.exec();
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('User not found');
    const doc = await this.userModel.findById(id).exec();
    if (!doc) throw new NotFoundException('User not found');
    return {
      id: doc.id,
      email: doc.email,
      displayName: doc.displayName,
      role: doc.role,
    };
  }

  async updateCurrentUser(
    id: string,
    dto: UpdateCurrentUserDto,
  ): Promise<User> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('User not found');
    const doc = await this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { displayName: dto.displayName },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('User not found');
    return {
      id: doc.id,
      email: doc.email,
      displayName: doc.displayName,
      role: doc.role,
    };
  }
}
