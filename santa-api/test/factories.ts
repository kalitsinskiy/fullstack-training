import { Types } from 'mongoose';

let counter = 0;
const uniq = () => `${Date.now()}-${counter++}`;

export const userFixture = (overrides: Partial<any> = {}) => ({
  _id: new Types.ObjectId(),
  email: `user-${uniq()}@test.com`,
  displayName: 'Test User',
  passwordHash: '$2b$10$placeholder',
  role: 'user',
  ...overrides,
});

export const roomFixture = (overrides: Partial<any> = {}) => ({
  _id: new Types.ObjectId(),
  name: 'Test Room',
  inviteCode: uniq().slice(-6).toUpperCase(),
  creatorId: new Types.ObjectId(),
  participants: [],
  status: 'pending',
  ...overrides,
});
