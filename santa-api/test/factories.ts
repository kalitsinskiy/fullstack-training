import { Types } from 'mongoose';

let counter = 0;

function uniq(): string {
  counter += 1;
  return `${Date.now()}-${counter}`;
}

export function userFixture(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(),
    email: `user-${uniq()}@test.com`,
    displayName: 'Test User',
    passwordHash: '$2b$10$placeholder',
    role: 'user',
    ...overrides,
  };
}

export function roomFixture(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(),
    name: 'Test Room',
    inviteCode: uniq().slice(-6).toUpperCase(),
    creatorId: new Types.ObjectId(),
    participants: [],
    status: 'pending',
    assignments: [],
    ...overrides,
  };
}
