// ============================================
// LET and CONST Examples
// ============================================

console.log('=== 1. Basic let usage ===');
let message = 'Hello';
console.log(message); // Hello

message = 'World'; // ✅ Can reassign let
console.log(message); // World

console.log('\n=== 2. Basic const usage ===');
const PI = 3.14159;
console.log(PI); // 3.14159

// PI = 3.14; // ❌ Error: Assignment to constant variable

console.log('\n=== 3. const with objects ===');
const user = {
  name: 'John',
  age: 30
};

console.log('Original:', user);

// ✅ Can modify object properties
user.name = 'Jane';
user.age = 25;
console.log('Modified:', user);

// ❌ Cannot reassign the object itself
// user = { name: 'Bob' }; // Error!

console.log('\n=== 4. const with arrays ===');
const numbers = [1, 2, 3];
console.log('Original:', numbers);

// ✅ Can modify array contents
numbers.push(4);
numbers[0] = 10;
console.log('Modified:', numbers);

// ❌ Cannot reassign the array itself
// numbers = [5, 6, 7]; // Error!

console.log('\n=== 5. let in loops ===');
for (let i = 0; i < 3; i++) {
  console.log('Loop iteration:', i);
}
// console.log(i); // ❌ Error: i is not defined (block scope)

console.log('\n=== 6. When to use let vs const ===');

// Use const by default
const MAX_USERS = 100;
const API_URL = 'https://jsonplaceholder.typicode.com';

// Use let when you need to reassign
let count = 0;
count += 1;
count += 1;
console.log('Count:', count);

let status = 'pending';
status = 'complete';
console.log('Status:', status);

console.log('\n=== Best Practice ===');
console.log('1. Use const by default');
console.log('2. Use let only when you need to reassign');
console.log('3. Never use var in modern JavaScript');
