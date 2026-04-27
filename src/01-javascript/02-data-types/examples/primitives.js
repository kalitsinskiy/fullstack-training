// ============================================
// PRIMITIVE TYPES Examples
// ============================================

console.log('=== 1. String ===');
const greeting = 'Hello';
const name = 'Alice';
const template = `My name is ${name}`; // Template literal
console.log(greeting, name);
console.log(template);
console.log('Type:', typeof greeting); // "string"

console.log('\n=== 2. Number ===');
const integer = 42;
const decimal = 3.14;
const negative = -10;
const scientificNotation = 1e6; // 1,000,000
console.log('Integer:', integer);
console.log('Decimal:', decimal);
console.log('Scientific:', scientificNotation);
console.log('Type:', typeof integer); // "number"

// Special numeric values
const infinity = Infinity;
const notANumber = NaN;
console.log('Infinity:', infinity);
console.log('NaN:', notANumber);
console.log('Is NaN?', isNaN(notANumber)); // true

console.log('\n=== 3. BigInt ===');
// For integers larger than 2^53 - 1
const bigNumber = 9007199254740991n; // Note the 'n' suffix
const anotherBig = BigInt(123456789);
console.log('BigInt:', bigNumber);
console.log('Type:', typeof bigNumber); // "bigint"
// console.log(bigNumber + 1); // ❌ Error: can't mix BigInt and Number
console.log('With BigInt:', bigNumber + 1n); // ✅ Works

console.log('\n=== 4. Boolean ===');
const isActive = true;
const isComplete = false;
console.log('isActive:', isActive);
console.log('Type:', typeof isActive); // "boolean"

// Booleans from comparisons
console.log('5 > 3:', 5 > 3); // true
console.log('10 === "10":', 10 === '10'); // false

console.log('\n=== 5. Undefined ===');
let notAssigned;
let alsoUndefined = undefined;
console.log('Not assigned:', notAssigned); // undefined
console.log('Type:', typeof notAssigned); // "undefined"

// Undefined from missing properties
const obj = { x: 1 };
console.log('Missing property:', obj.y); // undefined

console.log('\n=== 6. Null ===');
const emptyValue = null; // Intentional absence of value
console.log('Null value:', emptyValue); // null
console.log('Type:', typeof emptyValue); // "object" ⚠️ (historical bug!)

// Common use case
let user = { name: 'Alice' };
user = null; // Clear the reference

console.log('\n=== 7. Symbol (Advanced) ===');
const sym1 = Symbol('description');
const sym2 = Symbol('description');
console.log('Symbol:', sym1);
console.log('Type:', typeof sym1); // "symbol"
console.log('Are equal?', sym1 === sym2); // false (always unique)

// Use case: unique object keys
const id = Symbol('id');
const user2 = {
  name: 'Bob',
  [id]: 123 // Unique property
};
console.log('User:', user2);
console.log('ID:', user2[id]);

console.log('\n=== 8. Primitive Immutability ===');
let str = 'hello';
str[0] = 'H'; // Does nothing - strings are immutable
console.log(str); // Still "hello"

// To change, create new value
str = 'Hello';
console.log(str); // "Hello"

console.log('\n=== 9. Primitive vs Object ===');
// Primitives are compared by value
let a = 5;
let b = 5;
console.log('a === b:', a === b); // true (same value)

// Objects are compared by reference
let obj1 = { x: 5 };
let obj2 = { x: 5 };
console.log('obj1 === obj2:', obj1 === obj2); // false (different objects)

let obj3 = obj1; // Same reference
console.log('obj1 === obj3:', obj1 === obj3); // true

console.log('\n=== Best Practices ===');
console.log('1. Use appropriate types for your data');
console.log('2. Understand null vs undefined');
console.log('3. Be careful with NaN and Infinity');
console.log('4. Remember: primitives are immutable');
console.log('5. Use BigInt for very large integers');
