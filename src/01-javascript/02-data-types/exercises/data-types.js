// ============================================
// DATA TYPES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/02-data-types/exercises/data-types.js

console.log('=== Exercise 1: Identify types ===');
// TODO: Use typeof to identify the type of each variable
const value1 = 'Hello';
const value2 = 42;
const value3 = true;
const value4 = undefined;
const value5 = null;
const value6 = {};
const value7 = [];

// Your code here (console.log the type of each):
console.log(typeof value1); //string
console.log(typeof value2); //number
console.log(typeof value3); //boolean
console.log(typeof value4); //undefined
console.log(typeof value5); //object
console.log(typeof value6); //object
console.log(typeof value7); //object

console.log('\n=== Exercise 2: Explicit conversion ===');
// TODO: Convert these values using String(), Number(), Boolean()
const str = '123';
const num = 456;
const bool = true;

// Convert str to number:
// Convert num to string:
// Convert str to boolean:
// Your code here:
const converted1 = Number(str);
console.log(typeof converted1);

const converted2 = String(num);
console.log(typeof converted2);

//Already boolean
console.log(typeof bool);

const converted3 = Boolean(String(bool));
console.log(typeof converted3);

console.log('\n=== Exercise 3: Find the falsy values ===');
// TODO: From this array, filter only the falsy values
const values = [0, 1, '', 'hello', null, undefined, false, true, NaN, ' '];
// Hint: use filter with a function that checks for falsy
// Your code here:

console.log(values.filter(falseFilter));

function falseFilter(value) {
  return Boolean(value) == false;
}

console.log('\n=== Exercise 4: Type coercion prediction ===');
// TODO: Predict the result BEFORE running, then uncomment and check

console.log('5' + 3); // 53
console.log('5' - 3); // 2
console.log('5' * '2'); // 10
console.log(true + false); // 1
console.log('hello' - 1); // NaN

// Write your predictions as comments:

console.log('\n=== Exercise 5: Fix the type comparison ===');
// TODO: This comparison should check if age is exactly the number 25
// Fix it using strict equality
/*
const age = "25";
if (age == 25) {
  console.log("Age is 25");
}
*/
// Your fixed code here (should NOT print):
/*
const age = 25;
if (age === 25){
  console.log("Age is 25");
}
*/

console.log('\n=== Exercise 6: Default values ===');
// TODO: Create a function that returns a display name
// If name is empty/null/undefined, return "Guest"
// But if name is 0 or false, return the value as-is
function getDisplayName(name) {
  if (name === '' || name === null || name === undefined) {
    return 'Guest';
  }
  if (name == false) {
    return name;
  }
  return name;
}

// Test cases (uncomment):
console.log(getDisplayName('Alice')); // "Alice"
console.log(getDisplayName('')); // "Guest"
console.log(getDisplayName(null)); // "Guest"
console.log(getDisplayName(0)); // 0
console.log(getDisplayName(false)); // false

console.log('\n=== Exercise 7: Check for valid number ===');
// TODO: Write a function that checks if a value is a valid number
// (not NaN, not string, actually a number type)
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// Test cases (uncomment):
console.log(isValidNumber(42)); // true
console.log(isValidNumber('42')); // false
console.log(isValidNumber(NaN)); // false
console.log(isValidNumber(Infinity)); // true or false? decide!

console.log('\n=== Exercise 8: Truthy/Falsy in practice ===');
// TODO: Filter this array to keep only truthy values
const mixedArray = [0, 1, false, 'hello', '', null, undefined, 'world', NaN];
// Your code here (use filter):
console.log(mixedArray.filter(Boolean));

console.log('\n=== Exercise 9: Safe property access ===');
// TODO: Complete this function to safely get a nested property
// If user or user.profile or user.profile.name doesn't exist, return "Anonymous"
function getUserName(user) {
  if (user !== null && typeof user.profile !== 'undefined') {
    const { name } = user.profile;
    if (name !== null && typeof name !== 'undefined') {
      return name;
    }
  }
  return 'Anonymous';
}

// Test cases (uncomment):
console.log(getUserName({ profile: { name: 'Alice' } })); // "Alice"
console.log(getUserName({ profile: {} })); // "Anonymous"
console.log(getUserName({})); // "Anonymous"
console.log(getUserName(null)); // "Anonymous"

console.log('\n=== Exercise 10: Type conversion chain ===');
// TODO: What's the result of this expression? Explain why.

const result = !!'' + !![] + !!0;
console.log(result);

// Your prediction and explanation:
// !!"" = false
// !![] = true
// !!0 = false
// Total = 1
// Explanation: !! operator converts data to boolean, then again
// converts false to 0 and true to 1: 0 + 1 + 0 = 1

console.log('\n=== 🎯 Challenge: Input validation ===');
// TODO: Create a function that validates user registration data
// Rules:
// - username: must be a non-empty string
// - age: must be a number between 0 and 120
// - email: must be a non-empty string
// - active: optional boolean (if provided)
// Return an object: { valid: true/false, errors: [] }

function validateRegistration(data) {
  const { username, age, email } = data;
  const result = { valid: false, errors: [] };

  if (username === '') {
    return { ...result, errors: ['username must be non-empty'] };
  }
  if (typeof age !== 'number' || age < 0 || age > 120) {
    return { ...result, errors: ['age must be a number'] };
  }
  if (email === '') {
    return { ...result, errors: ['email must be non-empty'] };
  }
  if (typeof data.active !== 'undefined') {
    if (typeof data.active !== 'boolean') {
      return { ...result, errors: ['error during check if user is active'] };
    }
  }
  return { ...result, valid: true };
}

// Test cases (uncomment):
console.log(
  validateRegistration({
    username: 'Alice',
    age: 25,
    email: 'alice@example.com',
  })
); // { valid: true, errors: [] }

console.log(
  validateRegistration({
    username: '',
    age: 25,
    email: 'alice@example.com',
  })
); // { valid: false, errors: ["username must be non-empty"] }

console.log(
  validateRegistration({
    username: 'Bob',
    age: 'twenty',
    email: 'bob@example.com',
  })
); // { valid: false, errors: ["age must be a number"] }

console.log('\n=== 🎯 Challenge: Smart defaults ===');
// TODO: Create a function that merges user settings with defaults
// Rules:
// - If setting is null/undefined, use default
// - If setting is 0, false, or "", keep it (don't use default)
// Hint: use ?? (nullish coalescing) or check !== null && !== undefined

function mergeSettings(defaults, userSettings) {
  const result = { ...defaults };
  for (const key in userSettings) {
    const val = userSettings[key];
    result[key] = val ?? defaults[key]; //??
  }
  return result;
}

// Test case (uncomment):
const defaults = { theme: 'light', fontSize: 16, notifications: true };
const user = { theme: 'dark', fontSize: 0, notifications: false };
console.log(mergeSettings(defaults, user));
//Should be: { theme: "dark", fontSize: 0, notifications: false }

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
