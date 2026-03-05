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
console.log('Value1 type:', typeof value1);
console.log('Value2 type:', typeof value2);
console.log('Value3 type:', typeof value3);
console.log('Value4 type:', typeof value4);
console.log('Value5 type:', typeof value5);
console.log('Value6 type:', typeof value6);
console.log('Value7 type:', typeof value7);

console.log('\n=== Exercise 2: Explicit conversion ===');
// TODO: Convert these values using String(), Number(), Boolean()
const str = '123';
const num = 456;
const bool = true;

// Convert str to number:
// Convert num to string:
// Convert str to boolean:
// Your code here:
console.log('Convert string to number:', Number(str));
console.log('Convert number to string:', String(num));
console.log('Convert string to boolean:', Boolean(str));

console.log('\n=== Exercise 3: Find the falsy values ===');
// TODO: From this array, filter only the falsy values
const values = [0, 1, '', 'hello', null, undefined, false, true, NaN, ' '];
// Hint: use filter with a function that checks for falsy
// Your code here:
const falsyOnly = values.filter((value) => !value);
console.log('Falthy values:', falsyOnly);

console.log('\n=== Exercise 4: Type coercion prediction ===');
// TODO: Predict the result BEFORE running, then uncomment and check
/*
console.log("5" + 3);        // ?
console.log("5" - 3);        // ?
console.log("5" * "2");      // ?
console.log(true + false);   // ?
console.log("hello" - 1);    // ?
*/
// Write your predictions as comments:
// string "53"
// number 2
// number 10
// number 1
// NaN

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
const age = '25';
age === 25 && console.log('Age is 25');

console.log('\n=== Exercise 6: Default values ===');
// TODO: Create a function that returns a display name
// If name is empty/null/undefined, return "Guest"
// But if name is 0 or false, return the value as-is
function getDisplayName(name) {
  // Your code here
  return name === '' || name == null ? 'Guest' : name;
}

let guestName;
console.log(getDisplayName(guestName)); // "Guest" in case of undefined variable

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
  // Your code here
  return typeof value !== 'number' || isNaN(value) || !isFinite(value)
    ? false
    : true;
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
const truthyArray = mixedArray.filter(Boolean);
console.log('Truthy values:', truthyArray);

console.log('\n=== Exercise 9: Safe property access ===');
// TODO: Complete this function to safely get a nested property
// If user or user.profile or user.profile.name doesn't exist, return "Anonymous"
function getUserName(user) {
  // Your code here
  // Hint: use && or optional chaining (?.)
  return user?.profile && user.profile?.name ? user.profile.name : 'Anonymous';
}

// Test cases (uncomment):
console.log(getUserName({ profile: { name: 'Alice' } })); // "Alice"
console.log(getUserName({ profile: {} })); // "Anonymous"
console.log(getUserName({})); // "Anonymous"
console.log(getUserName(null)); // "Anonymous"

console.log('\n=== Exercise 10: Type conversion chain ===');
// TODO: What's the result of this expression? Explain why.
/*
const result = !!"" + !![] + !!0;
console.log(result);
*/
// Your prediction and explanation:
// !!"" = false
// !![] = true
// !!0 = fale
// Total = 1
// Explanation: We are converting uexpression's values to boolean
// then trying to make sum: false + true + false = 0 + 1 + 0 = 1

console.log('\n=== 🎯 Challenge: Input validation ===');
// TODO: Create a function that validates user registration data
// Rules:
// - username: must be a non-empty string
// - age: must be a number between 0 and 120
// - email: must be a non-empty string
// - active: optional boolean (if provided)
// Return an object: { valid: true/false, errors: [] }

function validateRegistration(data) {
  // Your code here

  const errors = [];

  if (typeof data.username !== 'string' || !data.username.trim()) {
    errors.push('username must be non-empty');
  }

  if (typeof data.age !== 'number' || data.age < 0 || data.age > 120) {
    errors.push('age must be a number');
  }

  if (typeof data.email !== 'string' || !data.email.trim()) {
    errors.push('email must be non-empty string');
  }

  if (data.active !== undefined && typeof data.active !== 'boolean') {
    errors.push('active status must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
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
  // Your code here
  const merged = { ...defaults };

  for (const key in userSettings) {
    merged[key] = userSettings[key] ?? defaults[key];
  }

  return merged;
}

// Test case (uncomment):
const defaults = { theme: 'light', fontSize: 16, notifications: true };
const user = { theme: 'dark', fontSize: 0, notifications: false };
console.log(mergeSettings(defaults, user));
// Should be: { theme: "dark", fontSize: 0, notifications: false }

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
