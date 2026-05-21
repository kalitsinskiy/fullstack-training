import { AppError, NotFoundError, ValidationError, ConflictError } from '../errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    test('extends Error with correct defaults', () => {
      const err = new AppError('something went wrong');

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.name).toBe('AppError');
    });

    test('accepts custom statusCode and code', () => {
      const err = new AppError('unprocessable', 422, 'UNPROCESSABLE');

      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('UNPROCESSABLE');
    });
  });

  describe('NotFoundError', () => {
    test('creates a 404 with NOT_FOUND code and a formatted mmessage', () => {
      const err = new NotFoundError('Notification', 42);

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Notification with id "42" not found');
      expect(err.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    test('creates a 400 with VALIDATION_ERROR and contains details', () => {
      const details = [{ field: 'userId', msg: 'required' }];
      const err = new ValidationError('Validation failed', details);

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual(details);
    });
  });

  describe('ConflictError', () => {
    test('creates a 409 with CONFLICT code', () => {
      const err = new ConflictError('Already exists');

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });
  });
});
