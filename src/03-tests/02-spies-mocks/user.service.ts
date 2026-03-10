import { EmailService } from './email.service';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

export class UserService {
  private users = new Map<string, User>();

  constructor(
    private emailService: EmailService,
    private logger: Logger,
  ) {}

  async register(name: string, email: string): Promise<User> {
    if (!email.includes('@')) {
      throw new Error(`Invalid email: ${email}`);
    }

    const id = Math.random().toString(36).slice(2);
    const user: User = { id, name, email, createdAt: new Date() };

    this.users.set(id, user);
    this.logger.log(`User registered: ${email}`);
    await this.emailService.sendWelcome(email, name);

    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.users.has(id)) {
      this.logger.error(`User not found: ${id}`);
      return false;
    }
    this.users.delete(id);
    this.logger.log(`User deleted: ${id}`);
    return true;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserCount(): number {
    return this.users.size;
  }
}
