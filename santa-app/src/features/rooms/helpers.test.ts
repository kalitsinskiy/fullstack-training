import { describe, it, expect } from 'vitest';
import {
  normalizeInviteCode,
  isValidInviteCode,
  cleanWishlistItems,
  isExchangePassed,
} from './helpers';

describe('normalizeInviteCode', () => {
  it('trims, uppercases and caps at 6 chars', () => {
    expect(normalizeInviteCode('  q7x4lm  ')).toBe('Q7X4LM');
    expect(normalizeInviteCode('abcdefgh')).toBe('ABCDEF');
  });
});

describe('isValidInviteCode', () => {
  it('accepts exactly 6 alphanumerics, rejects otherwise', () => {
    expect(isValidInviteCode('Q7X4LM')).toBe(true);
    expect(isValidInviteCode('Q7X4L')).toBe(false);
    expect(isValidInviteCode('Q7X4L!')).toBe(false);
  });
});

describe('cleanWishlistItems', () => {
  it('trims items and drops blanks', () => {
    expect(cleanWishlistItems([' Socks ', '', '  ', 'Book'])).toEqual([
      'Socks',
      'Book',
    ]);
  });
});

describe('isExchangePassed', () => {
  const now = new Date(2026, 11, 25, 9);

  it('is false when no date is set — pending rooms never lock', () => {
    expect(isExchangePassed(undefined, now)).toBe(false);
    expect(isExchangePassed(null, now)).toBe(false);
  });

  it('is false for a future date', () => {
    expect(isExchangePassed('2026-12-31', now)).toBe(false);
  });

  it('is false ON the exchange day itself', () => {
    expect(isExchangePassed('2026-12-25', now)).toBe(false);
    expect(isExchangePassed('2026-12-25T00:00:00.000Z', now)).toBe(false);
  });

  it('is true the day after', () => {
    expect(isExchangePassed('2026-12-24', now)).toBe(true);
    expect(isExchangePassed('2026-12-24T00:00:00.000Z', now)).toBe(true);
  });

  it('does not lock on a bad value', () => {
    expect(isExchangePassed('not-a-date', now)).toBe(false);
  });
});
