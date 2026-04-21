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
  // TODO: implement
  if (_str.length === 0) return '';
  return _str[0].toUpperCase() + _str.slice(1);
}

// 2. Convert camelCase to kebab-case
// camelToKebab('helloWorld') → 'hello-world'
// camelToKebab('myVariableName') → 'my-variable-name'
// camelToKebab('already') → 'already'
export function camelToKebab(_str: string): string {
  // TODO: implement
  return _str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// 3. Truncate a string to maxLength, adding '...' if cut
// truncate('Hello World', 5) → 'Hello...'
// truncate('Hi', 10) → 'Hi'   (no truncation needed)
// truncate('Hello', 5) → 'Hello'  (exact length — no truncation)
export function truncate(_str: string, _maxLength: number): string {
  // TODO: implement
  if (_str.length <= _maxLength) return _str;
  return _str.slice(0, _maxLength) + '...';
}

// 4. Count words in a string (split by whitespace)
// countWords('hello world') → 2
// countWords('  multiple   spaces  ') → 2
// countWords('') → 0
// countWords('   ') → 0
export function countWords(_str: string): number {
  // TODO: implement
  const words = _str.trim().split(/\s+/);
  return words[0] === '' ? 0 : words.length;
}

// 5. Check if a string is a palindrome (case-insensitive, ignore spaces)
// isPalindrome('racecar') → true
// isPalindrome('A man a plan a canal Panama') → true
// isPalindrome('hello') → false
// isPalindrome('') → true
export function isPalindrome(_str: string): boolean {
  // TODO: implement
  const cleaned = _str.replace(/\s+/g, '').toLowerCase();
  return cleaned === cleaned.split('').reverse().join('');
}

// 6. Repeat a string n times with optional separator
// repeat('ab', 3) → 'ababab'
// repeat('ab', 3, '-') → 'ab-ab-ab'
// repeat('x', 1) → 'x'
// repeat('x', 0) → ''
export function repeat(_str: string, _times: number, _sep = ''): string {
  // TODO: implement
  if (_times <= 0) return '';
  return Array(_times).fill(_str).join(_sep);
}
