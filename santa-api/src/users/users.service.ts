import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(user: CreateUserDto): Promise<UserResponseDto> {
    return this.usersRepository.create(user);
  }

  findById(id: string): Promise<UserResponseDto | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(
    email: string,
    opts: { withPassword?: boolean } = {},
  ): Promise<UserResponseDto | null> {
    return this.usersRepository.findByEmail(email, opts);
  }

  updateById(
    id: string,
    updates: Partial<Pick<CreateUserDto, 'displayName' | 'email'>>,
  ): Promise<UserResponseDto | null> {
    return this.usersRepository.updateById(id, updates);
  }

  deleteById(id: string): Promise<boolean> {
    return this.usersRepository.deleteById(id);
  }
}
