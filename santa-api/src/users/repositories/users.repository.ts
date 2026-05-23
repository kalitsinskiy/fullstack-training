import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(user: CreateUserDto): Promise<UserResponseDto> {
    const doc = await this.userModel.create({
      email: user.email,
      displayName: user.displayName,
      passwordHash: user.passwordHash,
    });
    return new UserResponseDto(doc as any);
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? new UserResponseDto(doc as any) : null;
  }

  async findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserResponseDto | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (opts.withPassword) {
      query.select('+passwordHash');
    }
    const doc = await query.exec();
    return doc ? new UserResponseDto(doc as any) : null;
  }

  async updateById(
    id: string,
    updates: Partial<Pick<CreateUserDto, 'displayName' | 'email'>>,
  ): Promise<UserResponseDto | null> {
    const doc = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    return doc ? new UserResponseDto(doc as any) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
