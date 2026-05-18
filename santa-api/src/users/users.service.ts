import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  create(user: CreateUserDto) {
    return this.userModel.create({
      email: user.email,
      displayName: user.displayName,
      passwordHash: 'TODO_LESSON_08',
    });
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }
}
