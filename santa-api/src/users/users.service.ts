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
    const created = await this.userModel.create({
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
    });

    return this.toUser(created);
  }

  findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLocaleLowerCase() });

    if (opts.withPassword) {
      query.select('+passwordHash');
    }

    return query.exec();
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUser(user);
  }

  async updateCurrentUser(
    id: string,
    dto: UpdateCurrentUserDto,
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { displayName: dto.displayName }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUser(user);
  }

  private toUser(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      displayName: doc.displayName,
      email: doc.email,
      role: doc.role,
    };
  }
}
