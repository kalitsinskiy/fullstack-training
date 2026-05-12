import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(dto: { name: string; email: string }) {
    return this.userModel.create({
      email: dto.email,
      displayName: dto.name,
      passwordHash: 'TODO_LESSON_08',
    });
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
