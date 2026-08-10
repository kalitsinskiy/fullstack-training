import { ConflictException, NotFoundException } from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { rethrowDuplicateKey } from './mongo-errors';

function mongoError(code: number): MongoServerError {
  const err = new MongoServerError({ message: 'E11000 duplicate key' });
  err.code = code;

  return err;
}

describe('rethrowDuplicateKey', () => {
  it('translates a duplicate-key violation into a 409 with the given message', () => {
    expect(() =>
      rethrowDuplicateKey(mongoError(11000), 'Email is already registered'),
    ).toThrow(ConflictException);

    expect(() =>
      rethrowDuplicateKey(mongoError(11000), 'Email is already registered'),
    ).toThrow('Email is already registered');
  });

  it('propagates a MongoServerError with a different code untouched', () => {
    const other = mongoError(121);

    expect(() => rethrowDuplicateKey(other, 'nope')).toThrow(other);
  });

  it('propagates a non-Mongo error untouched', () => {
    const testError = new NotFoundException('Room not found');

    expect(() => rethrowDuplicateKey(testError, 'nope')).toThrow(testError);
  });

  it('propagates a plain Error untouched', () => {
    const testError = new Error('connection timed out');

    expect(() => rethrowDuplicateKey(testError, 'nope')).toThrow(
      'connection timed out',
    );
  });
});
