export class UserResponseDto {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  passwordHash?: string; // Optional for auth.service
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    _id?: string;
    id?: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    passwordHash?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const idValue = (data.id || data._id)?.toString() || '';
    this.id = idValue;
    this.email = data.email;
    this.displayName = data.displayName;
    this.role = data.role;
    this.passwordHash = data.passwordHash;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
