// ============================================
// STRINGS Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/04-strings/exercises/strings.js

console.log('=== Exercise 1: Basic methods ===');
// TODO: Given the string below, log:
// - its length
// - first and last character
// - the word "World" extracted with slice()
const greeting = 'Hello, World!';
// Your code here:
console.log(greeting.length);
console.log(`First: ${greeting[0]}, Last: ${greeting[greeting.length - 1]}`);
console.log(`Slice 'World': ${greeting.slice(-6, -1)}`);

console.log('\n=== Exercise 2: Search ===');
// TODO: Check if the email is valid by verifying:
// - it includes '@'
// - it ends with '.com' or '.org'
// - log true/false
const email = 'user@example.com';
// Your code here:
const isValid = (value) => {
  return (
    value.includes('@') && (value.endsWith('.com') || value.endsWith('.org'))
  );
};

console.log(isValid(email));

console.log('\n=== Exercise 3: Transform ===');
// TODO: Transform "  hello world  " to "Hello World"
// Steps: trim → split by space → capitalize each word → join
const messy = '  hello world  ';
// Your code here:
const clean = messy
  .trim()
  .split(' ')
  .map((i) => i[0].toUpperCase() + i.slice(1))
  .join(' ');

console.log(clean);

console.log('\n=== Exercise 4: Template literal ===');
// TODO: Build a greeting card using template literal
// Format: "Dear [name], Happy [occasion]! Best wishes, [sender]"
const recipient = 'Alice';
const occasion = 'Birthday';
const sender = 'Bob';
// Your code here:
console.log(`Dear ${recipient}, Happy ${occasion}! Best wishes, ${sender}`);

console.log('\n=== Exercise 5: Replace ===');
// TODO: Replace ALL occurrences of "foo" (any case) with "bar"
const text = 'Foo is foo. FOO is also foo!';
// Hint: use replaceAll() or replace() with regex /foo/gi
// Your code here:
console.log(text.replaceAll(/foo/gi, 'bar'));

console.log('\n=== Exercise 6: Split and join ===');
// TODO: Convert this comma-separated string to an array,
// reverse the order, then join back with " | "
const fruits = 'apple,banana,cherry,orange';
// Expected: 'orange | cherry | banana | apple'
// Your code here:
const anotherResult = fruits.split(',').reverse().join(' | ');
console.log(`Result: ${anotherResult}`);

console.log('\n=== Exercise 7: Padding ===');
// TODO: Format these numbers as prices with padStart
// Each number should be right-aligned in a field of 8 chars, prefixed with '$'
const prices = [9.99, 150.0, 2500.5];
// Expected output like: "  $ 9.99", "$ 150.00", "$2500.50"
// Your code here:
console.log(prices.map((p) => `$ ${p.toFixed(2)}`.padStart(7, ' ')));
//toFixed meaning 2 sighns after comma

console.log('\n=== Exercise 8: Palindrome check ===');
// TODO: Write a function that checks if a string is a palindrome
// Ignore spaces and case
// isPalindrome("race a car") → false
// isPalindrome("A man a plan a canal Panama") → true
function isPalindrome(str) {
  return str.toLowerCase() === str.split('').reverse().join('');
}

console.log(isPalindrome('racecar')); // true
console.log(isPalindrome('hello')); // false

console.log('\n=== 🎯 Challenge: Truncate text ===');
// TODO: Create a function that truncates text to maxLength characters
// If truncated, append '...' at the end
// truncate("Hello World", 8) → "Hello..."
// truncate("Hi", 8) → "Hi"
function truncate(str, maxLength) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
  }
  return str;
}
console.log(truncate('Hello, World!', 8)); // 'Hello...'
console.log(truncate('Hi', 8)); // 'Hi'

console.log('\n=== 🎯 Challenge: Count words ===');
// TODO: Create a function that counts word frequency in a string
// countWords("the cat sat on the mat") → { the: 2, cat: 1, sat: 1, on: 1, mat: 1 }
function countWords(str) {
  const resultObj = {};
  for (const item of str.split(' ')) {
    resultObj[item] = (resultObj[item] || 0) + 1;
    //short circuit return first false or last item
  }
  return resultObj;
}
console.log(countWords('the cat sat on the mat the'));

console.log('\n=== 🎯 Challenge: Camel to snake case ===');
// TODO: Convert camelCase to snake_case
// camelToSnake("helloWorld") → "hello_world"
// camelToSnake("myVariableName") → "my_variable_name"
function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  //finds all uppercase letters, and replace with _Letter
}

console.log(camelToSnake('helloWorld')); // 'hello_world'
console.log(camelToSnake('myVariableName')); // 'my_variable_name'

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
