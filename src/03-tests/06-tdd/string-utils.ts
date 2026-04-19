// ============================================
// STRING UTILS — implement each function
// ============================================
// Tests are already written in string-utils.test.ts
// Run: npx jest src/03-tests/06-tdd --watch
// Your goal: make all tests pass, one by one

// 1. Capitalize first letter of a string
// capitalize('hello') → 'Hello'
// capitalize('') → ''
// capitalize('already') → 'Already'
export function capitalize(_str: string): string {
  return _str.charAt(0).toUpperCase() + _str.slice(1);
}

// 2. Convert camelCase to kebab-case
// camelToKebab('helloWorld') → 'hello-world'
// camelToKebab('myVariableName') → 'my-variable-name'
// camelToKebab('already') → 'already'
export function camelToKebab(_str: string): string {
  return _str.replace(
    /[A-Z]/g,
    (match, offset) => {
      return offset === 0
        ? match.toLowerCase()
        : '-' + match.toLowerCase();
    }
  );
}

// 3. Truncate a string to maxLength, adding '...' if cut
// truncate('Hello World', 5) → 'Hello...'
// truncate('Hi', 10) → 'Hi'   (no truncation needed)
// truncate('Hello', 5) → 'Hello'  (exact length — no truncation)
export function truncate(_str: string, _maxLength: number): string {
  if (_str.length <= _maxLength) return _str;
  return _str.slice(0, _maxLength) + '...';
}

// 4. Count words in a string (split by whitespace)
// countWords('hello world') → 2
// countWords('  multiple   spaces  ') → 2
// countWords('') → 0
// countWords('   ') → 0
export function countWords(_str: string): number {
  const trimmed = _str.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

// 5. Check if a string is a palindrome (case-insensitive, ignore spaces)
// isPalindrome('racecar') → true
// isPalindrome('A man a plan a canal Panama') → true
// isPalindrome('hello') → false
// isPalindrome('') → true
export function isPalindrome(_str: string): boolean {
  const lowerNoSpaces = _str.toLocaleLowerCase().replaceAll(/\s/g, '');
  const reversed = lowerNoSpaces.split('').reverse().join('');
  return lowerNoSpaces === reversed;
}

// 6. Repeat a string n times with optional separator
// repeat('ab', 3) → 'ababab'
// repeat('ab', 3, '-') → 'ab-ab-ab'
// repeat('x', 1) → 'x'
// repeat('x', 0) → ''
export function repeat(_str: string, _times: number, _sep = ''): string {
  const result = [''];

  for (let i = 1; i <= _times; i++) {
    result.push(
      i === _times
        ? _str
        : _str + _sep
    );
  }

  return result.join('');
}
