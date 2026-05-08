import { Injectable } from '@nestjs/common';
import User, { CreateUserDto } from './models/user';

@Injectable()
export class UsersService {
  private readonly users: Map<string, User> = new Map();

  create(user: CreateUserDto): User {
    const id = crypto.randomUUID();
    const newUser: User = {
      id,
      createdAt: new Date(),
      ...user,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }
}
