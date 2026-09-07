import { ConflictException } from '@nestjs/common';
import { MongoServerError } from 'mongodb';

/** Mongo's duplicate-key error code. */
const DUPLICATE_KEY = 11000;

export function rethrowDuplicateKey(err: unknown, message: string): never {
  if (err instanceof MongoServerError && err.code === DUPLICATE_KEY) {
    throw new ConflictException(message);
  }

  throw err;
}
