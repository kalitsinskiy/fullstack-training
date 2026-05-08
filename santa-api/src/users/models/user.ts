export default interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
type UpdateUserDto = Partial<CreateUserDto>;

export type { CreateUserDto, UpdateUserDto };
