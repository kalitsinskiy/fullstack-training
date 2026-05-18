import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

interface CreateUserPayload {
  email: string;
  passwordHash: string;
  displayName: string;
  role?: 'user' | 'admin';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  create(payload: CreateUserPayload) {
    return this.userModel.create({
      email: payload.email,
      displayName: payload.displayName,
      passwordHash: payload.passwordHash,
      role: payload.role ?? 'user',
    });
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string, opts: { withPassword?: boolean } = {}) {
    // passwordHash has select: false on the schema — only opt in where strictly needed
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (opts.withPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  updateById(id: string, dto: UpdateUserDto) {
    return this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
  }
}
