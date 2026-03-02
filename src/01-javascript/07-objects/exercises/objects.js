// ============================================
// OBJECTS Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/07-objects/exercises/objects.js

console.log('=== Exercise 1: Create and access ===');
// TODO: Create an object 'car' with brand, model, and year properties
// Access and log each property using both dot and bracket notation
// Your code here:


console.log('\n=== Exercise 2: Object methods ===');
// TODO: Create an object 'calculator' with add, subtract methods
// Each method should use this.value and return this for chaining
// Example: calculator.add(5).subtract(2).getValue() should return 3
// Your code here:


console.log('\n=== Exercise 3: Object destructuring ===');
// TODO: Destructure this object to get name and age
// Rename age to userAge
// Set default value for city to 'Unknown'
const user = { name: 'Alice', age: 25 };
// Your code here:


console.log('\n=== Exercise 4: Nested destructuring ===');
// TODO: Extract city and country from the nested address
const person = {
  name: 'Bob',
  address: {
    city: 'London',
    country: 'UK'
  }
};
// Your code here:


console.log('\n=== Exercise 5: Spread operator ===');
// TODO: Create a copy of original
// Add a new property 'c: 3' without modifying original
const original = { a: 1, b: 2 };
// Your code here:


console.log('\n=== Exercise 6: Merge objects ===');
// TODO: Merge defaults and userSettings
// userSettings should override defaults
const defaults = { theme: 'light', fontSize: 14, sidebar: true };
const userSettings = { theme: 'dark', fontSize: 16 };
// Your code here:


console.log('\n=== Exercise 7: Object.keys/values/entries ===');
// TODO: Use Object methods to:
// 1. Get all property names
// 2. Get all values
// 3. Log each key-value pair
const product = { name: 'Laptop', price: 1000, inStock: true };
// Your code here:


console.log('\n=== Exercise 8: Transform object ===');
// TODO: Double all prices using Object.entries and Object.fromEntries
const prices = { apple: 1.5, banana: 0.5, orange: 2.0 };
// Your code here:


console.log('\n=== Exercise 9: this keyword ===');
// TODO: Fix this object so the greet method can access the name
/*
const person = {
  name: 'Alice',
  greet: () => {
    console.log(`Hello, I'm ${this.name}`);
  }
};
*/
// Your fixed code here:


console.log('\n=== Exercise 10: Optional chaining ===');
// TODO: Safely access user.profile.email using optional chaining
// Should not throw error if profile doesn't exist
const userData = { name: 'Bob' }; // no profile!
// Your code here:


console.log('\n=== 🎯 Challenge: Deep clone ===');
// TODO: Create a deep clone function that copies nested objects
function deepClone(obj) {
  // Your code here
  // Hint: Use recursion or JSON.parse(JSON.stringify())
}

// Test it (uncomment):
// const original = { a: 1, b: { c: 2 } };
// const cloned = deepClone(original);
// cloned.b.c = 99;
// console.log(original.b.c); // Should still be 2


console.log('\n=== 🎯 Challenge: Pick properties ===');
// TODO: Create a function that picks specific properties from an object
function pick(obj, keys) {
  // Your code here
  // Hint: Use Object.fromEntries and filter
}

// Test it (uncomment):
// const data = { a: 1, b: 2, c: 3, d: 4 };
// console.log(pick(data, ['a', 'c'])); // { a: 1, c: 3 }


console.log('\n=== 🎯 Challenge: Group by property ===');
// TODO: Group array of objects by a specific property
function groupBy(array, property) {
  // Your code here
  // Hint: Use reduce
}

// Test it (uncomment):
// const users = [
//   { name: 'Alice', role: 'admin' },
//   { name: 'Bob', role: 'user' },
//   { name: 'Charlie', role: 'admin' }
// ];
// console.log(groupBy(users, 'role'));
// Should be: { admin: [{...}, {...}], user: [{...}] }


console.log('\n=== 🎯 Challenge: Flatten object ===');
// TODO: Flatten nested object to dot notation
// Example: { a: { b: { c: 1 } } } -> { 'a.b.c': 1 }
function flattenObject(obj, prefix = '') {
  // Your code here
  // Hint: Use recursion
}

// Test it (uncomment):
// const nested = { a: 1, b: { c: 2, d: { e: 3 } } };
// console.log(flattenObject(nested));
// Should be: { a: 1, 'b.c': 2, 'b.d.e': 3 }


console.log('\n=== 🎯 Challenge: Object diff ===');
// TODO: Find differences between two objects
function diff(obj1, obj2) {
  // Your code here
  // Return object with changed properties
}

// Test it (uncomment):
// const before = { a: 1, b: 2, c: 3 };
// const after = { a: 1, b: 999, d: 4 };
// console.log(diff(before, after));
// Should show: { b: 999, d: 4 } (or similar)


console.log('\n✅ Exercises completed! Check your answers with a mentor.');
