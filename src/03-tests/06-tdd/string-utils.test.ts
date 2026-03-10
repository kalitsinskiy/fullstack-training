import { capitalize, camelToKebab, truncate, countWords, isPalindrome, repeat } from './string-utils';

// ============================================
// TDD EXERCISE — Tests are written, you implement!
// ============================================
// Run: npx jest src/03-tests/06-tdd --watch
// Start: ALL tests are RED (throw 'Not implemented')
// Goal:  Make them GREEN one by one
// ============================================

describe('capitalize', () => {
  test('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });

  test('already capitalized stays the same', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  test('single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  test('does not affect other letters', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });
});

describe('camelToKebab', () => {
  test('converts camelCase to kebab-case', () => {
    expect(camelToKebab('helloWorld')).toBe('hello-world');
  });

  test('multi-word', () => {
    expect(camelToKebab('myVariableName')).toBe('my-variable-name');
  });

  test('already lowercase word', () => {
    expect(camelToKebab('hello')).toBe('hello');
  });

  test('starts with uppercase', () => {
    expect(camelToKebab('MyComponent')).toBe('my-component');
  });
});

describe('truncate', () => {
  test('truncates to maxLength with ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  test('does not truncate when string is shorter', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  test('does not truncate when string is exactly maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  test('empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  test('maxLength of 0 returns ellipsis only', () => {
    expect(truncate('Hello', 0)).toBe('...');
  });
});

describe('countWords', () => {
  test('counts words separated by single spaces', () => {
    expect(countWords('hello world')).toBe(2);
  });

  test('handles multiple spaces', () => {
    expect(countWords('  multiple   spaces  ')).toBe(2);
  });

  test('empty string returns 0', () => {
    expect(countWords('')).toBe(0);
  });

  test('only spaces returns 0', () => {
    expect(countWords('   ')).toBe(0);
  });

  test('single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  test('five words', () => {
    expect(countWords('one two three four five')).toBe(5);
  });
});

describe('isPalindrome', () => {
  test('simple palindrome', () => {
    expect(isPalindrome('racecar')).toBe(true);
  });

  test('not a palindrome', () => {
    expect(isPalindrome('hello')).toBe(false);
  });

  test('case-insensitive', () => {
    expect(isPalindrome('Racecar')).toBe(true);
  });

  test('ignores spaces', () => {
    expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
  });

  test('empty string is palindrome', () => {
    expect(isPalindrome('')).toBe(true);
  });

  test('single character is palindrome', () => {
    expect(isPalindrome('a')).toBe(true);
  });
});

describe('repeat', () => {
  test('repeats string n times', () => {
    expect(repeat('ab', 3)).toBe('ababab');
  });

  test('with separator', () => {
    expect(repeat('ab', 3, '-')).toBe('ab-ab-ab');
  });

  test('repeat once', () => {
    expect(repeat('x', 1)).toBe('x');
  });

  test('repeat zero times returns empty string', () => {
    expect(repeat('x', 0)).toBe('');
  });

  test('separator not added for single repeat', () => {
    expect(repeat('ab', 1, '-')).toBe('ab');
  });
});
