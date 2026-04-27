// ============================================
// TYPEOF OPERATOR Examples
// ============================================

console.log('=== 1. Basic typeof Usage ===');

// Primitives
console.log(typeof 'hello');        // "string"
console.log(typeof 42);             // "number"
console.log(typeof 3.14);           // "number"
console.log(typeof true);           // "boolean"
console.log(typeof undefined);      // "undefined"
console.log(typeof 123n);           // "bigint"
console.log(typeof Symbol('id'));   // "symbol"

// Objects and functions
console.log(typeof {});             // "object"
console.log(typeof []);             // "object" (arrays are objects!)
console.log(typeof null);           // "object" ⚠️ (historical bug)
console.log(typeof function() {}); // "function"

console.log('\n=== 2. typeof with Variables ===');

let name = 'Alice';
let age = 25;
let isStudent = true;
let address;
let nothing = null;

console.log('name:', typeof name);           // "string"
console.log('age:', typeof age);             // "number"
console.log('isStudent:', typeof isStudent); // "boolean"
console.log('address:', typeof address);     // "undefined"
console.log('nothing:', typeof nothing);     // "object" ⚠️

console.log('\n=== 3. typeof in Conditionals ===');

function processValue(value) {
  if (typeof value === 'string') {
    console.log('Processing string:', value.toUpperCase());
  } else if (typeof value === 'number') {
    console.log('Processing number:', value * 2);
  } else if (typeof value === 'boolean') {
    console.log('Processing boolean:', !value);
  } else {
    console.log('Unknown type:', typeof value);
  }
}

processValue('hello');  // String
processValue(42);       // Number
processValue(true);     // Boolean
processValue({});       // Object

console.log('\n=== 4. typeof with Undefined ===');

let x;
console.log('Declared but not assigned:', typeof x); // "undefined"

let obj = { name: 'Alice' };
console.log('Missing property:', typeof obj.age);    // "undefined"

// Safe check without error
console.log('Undeclared variable:', typeof someRandomVar); // "undefined"
// console.log(someRandomVar); // ❌ Would throw ReferenceError

console.log('\n=== 5. typeof Gotchas ===');

// null is "object" (bug since JavaScript v1)
console.log('typeof null:', typeof null); // "object"
// Correct way to check for null:
let value = null;
console.log('Is null?', value === null); // true

// Arrays are objects
let arr = [1, 2, 3];
console.log('typeof array:', typeof arr); // "object"
// Correct way to check for array:
console.log('Is array?', Array.isArray(arr)); // true

// NaN is a number!
console.log('typeof NaN:', typeof NaN); // "number"
console.log('Is NaN?', isNaN(NaN));     // true

// Functions are special
function myFunc() {}
console.log('typeof function:', typeof myFunc); // "function"
// But technically functions are objects
console.log('Function is object?', myFunc instanceof Object); // true

console.log('\n=== 6. Type Checking Best Practices ===');

// Checking for string
const str = 'hello';
if (typeof str === 'string') {
  console.log('✅ It\'s a string');
}

// Checking for number (excluding NaN)
const num = 42;
if (typeof num === 'number' && !isNaN(num)) {
  console.log('✅ It\'s a valid number');
}

// Checking for array
const array = [1, 2, 3];
if (Array.isArray(array)) {
  console.log('✅ It\'s an array');
}

// Checking for null
const nullValue = null;
if (nullValue === null) {
  console.log('✅ It\'s null');
}

// Checking for object (excluding null and arrays)
const realObject = { x: 1 };
if (typeof realObject === 'object' && realObject !== null && !Array.isArray(realObject)) {
  console.log('✅ It\'s a real object');
}

// Checking for undefined
let undefinedVar;
if (typeof undefinedVar === 'undefined') {
  console.log('✅ It\'s undefined');
}

// Checking for function
const func = () => {};
if (typeof func === 'function') {
  console.log('✅ It\'s a function');
}

console.log('\n=== 7. Practical Example: Validation ===');

function validateInput(data) {
  // Check required string
  if (typeof data.name !== 'string' || data.name === '') {
    return 'Name must be a non-empty string';
  }

  // Check required number
  if (typeof data.age !== 'number' || isNaN(data.age)) {
    return 'Age must be a valid number';
  }

  // Check optional boolean
  if (data.active !== undefined && typeof data.active !== 'boolean') {
    return 'Active must be a boolean';
  }

  return 'Valid!';
}

console.log(validateInput({ name: 'Alice', age: 25 }));
console.log(validateInput({ name: 'Bob', age: 'thirty' }));
console.log(validateInput({ name: '', age: 25 }));

console.log('\n=== Best Practices ===');
console.log('1. Use typeof for primitives: string, number, boolean, undefined, symbol, bigint');
console.log('2. Don\'t use typeof for null - use value === null');
console.log('3. Don\'t use typeof for arrays - use Array.isArray()');
console.log('4. For numbers, also check !isNaN() to exclude NaN');
console.log('5. typeof is safe for undeclared variables (won\'t throw error)');
