import { describe, it, expect, afterAll } from 'vitest';
import { format } from 'date-fns';
import {
  normalizeInviteCode,
  cleanWishlistItems,
  isExchangePassed,
  parseExchangeDate,
} from './helpers';

describe('normalizeInviteCode', () => {
  it('trims, uppercases and caps at 6 chars', () => {
    expect(normalizeInviteCode('  q7x4lm  ')).toBe('Q7X4LM');
    expect(normalizeInviteCode('abcdefgh')).toBe('ABCDEF');
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

describe('parseExchangeDate', () => {
  const utcMidnight = '2026-12-24T00:00:00.000Z';
  const originalTz = process.env.TZ;

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('keeps the calendar day west of UTC, where new Date() rolls it back', () => {
    process.env.TZ = 'America/New_York';

    expect(format(new Date(utcMidnight), 'yyyy-MM-dd')).toBe('2026-12-23');

    expect(format(parseExchangeDate(utcMidnight), 'yyyy-MM-dd')).toBe(
      '2026-12-24',
    );
  });

  it('round-trips a plain date-only string', () => {
    expect(format(parseExchangeDate('2026-12-24'), 'yyyy-MM-dd')).toBe(
      '2026-12-24',
    );
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
