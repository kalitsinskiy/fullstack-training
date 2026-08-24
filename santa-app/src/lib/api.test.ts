import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';
import { getApiErrorMessage } from './api';

function makeAxiosError(data: unknown, status = 400): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: axios.defaults.headers } as never,
  };
  return error;
}

describe('getApiErrorMessage', () => {
  it('returns fallback for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('oops'), 'fallback')).toBe('fallback');
  });

  it('returns fallback when response has no error envelope', () => {
    expect(getApiErrorMessage(makeAxiosError({ message: 'old format' }), 'fallback')).toBe(
      'fallback',
    );
  });

  it('returns the message string from the error envelope', () => {
    expect(
      getApiErrorMessage(makeAxiosError({ error: { message: 'Email already in use' } })),
    ).toBe('Email already in use');
  });

  it('joins an array message into a single string', () => {
    expect(
      getApiErrorMessage(
        makeAxiosError({ error: { message: ['field is required', 'invalid email'] } }),
      ),
    ).toBe('field is required, invalid email');
  });

  it('returns the default fallback when no fallback argument is provided', () => {
    expect(getApiErrorMessage(new Error('oops'))).toBe('Something went wrong');
  });
});
