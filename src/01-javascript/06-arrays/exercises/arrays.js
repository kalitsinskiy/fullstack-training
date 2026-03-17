// ============================================
// ARRAYS Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/06-arrays/exercises/arrays.js

console.log('=== Exercise 1: Array basics ===');
// TODO: Create an array of 5 colors
// Add one color to the end
// Remove the first color
// Log the final array
// Your code here:
const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
colors.push('orange');
colors.shift();
console.log(colors);

console.log('\n=== Exercise 2: map() ===');
// TODO: Use map() to double each number
const numbers = [1, 2, 3, 4, 5];
// Your code here:
const doubleNumber = numbers.map((n) => n * 2);
console.log(doubleNumber);

console.log('\n=== Exercise 3: filter() ===');
// TODO: Use filter() to keep only even numbers
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// Your code here:
const evenNumbers = nums.filter((n) => n % 2 === 0);
console.log(evenNumbers);

console.log('\n=== Exercise 4: reduce() ===');
// TODO: Use reduce() to sum all numbers
const values = [10, 20, 30, 40, 50];
// Your code here:
const reduceNumber = values.reduce((acc, n) => acc + n, 0);
console.log(reduceNumber);

console.log('\n=== Exercise 5: Method chaining ===');
// TODO: Chain map, filter, and reduce to:
// 1. Square each number
// 2. Keep only numbers > 10
// 3. Sum the remaining numbers
const chain = [1, 2, 3, 4, 5];
// Your code here:
const chainNumber = chain
  .map((n) => n * n)
  .filter((n) => n > 10)
  .reduce((acc, n) => acc + n, 0);
console.log(chainNumber);

console.log('\n=== Exercise 6: forEach() vs map() ===');
// TODO: Explain the difference and rewrite this using the correct method
/*
const prices = [10, 20, 30];
const doubled = [];
prices.map(price => {
  doubled.push(price * 2);
});
*/
// Your code here:
const prices = [10, 20, 30];
const doubled = prices.map((price) => price * 2);
console.log(doubled);
console.log(prices);

console.log('\n=== Exercise 7: find() ===');
// TODO: Find the first user over 25 years old
const users = [
  { name: 'Alice', age: 20 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 25 },
];
// Your code here:
const findUser = users.find((user) => user.age > 25);
console.log(findUser);

console.log('\n=== Exercise 8: some() and every() ===');
// TODO: Check if ANY score is above 90
// TODO: Check if ALL scores are above 50
const scores = [65, 78, 92, 55, 88];
// Your code here:
const above90 = scores.some((score) => score > 90);
const above50 = scores.every((score) => score > 50);
console.log('Any above 90:', above90);
console.log('All above 50:', above50);

console.log('\n=== Exercise 9: Array destructuring ===');
// TODO: Destructure this array to get first, second, and rest
const arr = [1, 2, 3, 4, 5];
// const [?, ?, ...?] = arr;
// Your code here:
const [first, second, ...rest] = arr;
console.log('First:', first);
console.log('Second:', second);
console.log('Rest:', rest);

console.log('\n=== Exercise 10: Spread operator ===');
// TODO: Combine these arrays using spread operator
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
// Your code here:
const combined = [...arr1, ...arr2];
console.log(combined);

console.log('\n=== 🎯 Challenge: Remove duplicates ===');
// TODO: Remove all duplicate numbers from this array
const withDuplicates = [1, 2, 2, 3, 3, 3, 4, 4, 5];
// Hint: Use Set or reduce
// Your code here:
const unique = [...new Set(withDuplicates)];
console.log(unique);

console.log('\n=== 🎯 Challenge: Group by property ===');
// TODO: Group users by age
// Expected output: { 20: [{...}], 25: [{...}, {...}] }
const people = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 20 },
  { name: 'Charlie', age: 25 },
];
// Hint: Use reduce
// Your code here:
const groupByAge = people.reduce((acc, person) => {
  const age = person.age;
  if (!acc[age]) {
    acc[age] = [];
  }
  acc[age].push(person);
  return acc;
}, {});
console.log(groupByAge);

console.log('\n=== 🎯 Challenge: Flatten nested array ===');
// TODO: Flatten this nested array completely
const nested = [1, [2, [3, [4, 5]]]];
// Expected: [1, 2, 3, 4, 5]
// Try two ways: 1) flat(Infinity) 2) reduce recursively
// Your code here:
const flattened = nested.flat(Infinity);
console.log(flattened);

const flattenWithReduce = (arr) =>
  arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      return acc.concat(flattenWithReduce(val));
    } else {
      return acc.concat(val);
    }
  }, []);
console.log(flattenWithReduce(nested));

console.log('\n=== 🎯 Challenge: Array intersection ===');
// TODO: Find common elements in both arrays
const set1 = [1, 2, 3, 4, 5];
const set2 = [3, 4, 5, 6, 7];
// Expected: [3, 4, 5]
// Your code here:
const intersection = set1.filter((n) => set2.includes(n));
console.log(intersection);

console.log('\n=== 🎯 Challenge: Count occurrences ===');
// TODO: Count how many times each fruit appears
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
// Expected: { apple: 3, banana: 2, orange: 1 }
// Hint: Use reduce
// Your code here:
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(count);

console.log('\n=== 🎯 Challenge: Custom map() ===');
// TODO: Implement your own version of map()
function customMap(array, callback) {
  // Your code here
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(callback(array[i], i, array));
  }
  return result;
}

// Test it (uncomment):
const test = customMap([1, 2, 3], (n) => n * 2);
console.log(test); // Should be [2, 4, 6]

console.log('\n=== 🎯 Challenge: Array pagination ===');
// TODO: Split array into pages of given size
function paginate(array, pageSize) {
  // Your code here
  // Hint: Use reduce or a loop
  const pages = [];
  for (let i = 0; i < array.length; i += pageSize) {
    pages.push(array.slice(i, i + pageSize));
  }
  return pages;
}

// Test it (uncomment):
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log(paginate(data, 3));
// Should be: [[1,2,3], [4,5,6], [7,8,9], [10]]

console.log('\n=== 🎯 Challenge: Sort by multiple properties ===');
// TODO: Sort users by age (ascending), then by name (alphabetically)
const usersToSort = [
  { name: 'Charlie', age: 25 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 20 },
];
// Expected order: Bob (20), Alice (25), Charlie (25)
// Your code here:
const sortedUsers = usersToSort.sort((a, b) => {
  if (a.age === b.age) {
    return a.name.localeCompare(b.name);
  }
  return a.age - b.age;
});
console.log(sortedUsers);

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
