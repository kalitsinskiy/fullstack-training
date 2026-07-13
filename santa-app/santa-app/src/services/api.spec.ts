import { describe, test, expect } from 'vitest';
import { ApiError, getErrorMessage } from './api';

describe('getErrorMessage', () => {
  test.each([
    [400, 'Invalid input. Please check your data.'],
    [401, 'Session expired. Please log in again.'],
    [403, 'You do not have permission to do this.'],
    [404, 'The requested resource was not found.'],
    [409, 'This item already exists.'],
    [429, 'Too many requests. Please wait and try again.'],
    [500, 'Server error. Please try again later.'],
  ])('maps ApiError status %i to a user-facing message', (status, expected) => {
    expect(getErrorMessage(new ApiError(status, 'raw server message'))).toBe(expected);
  });

  test('falls back to the raw message for an unmapped ApiError status', () => {
    expect(getErrorMessage(new ApiError(418, "I'm a teapot"))).toBe("I'm a teapot");
  });

  test('recognizes a fetch network failure', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Network error. Check your connection.',
    );
  });

  test('falls back to a generic message for anything else', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('An unexpected error occurred.');
    expect(getErrorMessage('a plain string')).toBe('An unexpected error occurred.');
  });
});
