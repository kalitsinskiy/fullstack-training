import { describe, it, expect } from 'vitest';
import {
  normalizeInviteCode,
  isValidInviteCode,
  cleanWishlistItems,
} from './helpers';

describe('normalizeInviteCode', () => {
  it('trims, uppercases and caos at 6 chars', () => {
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
