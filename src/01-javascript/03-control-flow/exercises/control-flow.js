// ============================================
// CONTROL FLOW Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/03-control-flow/exercises/control-flow.js

console.log('=== Exercise 1: if/else ===');
// TODO: Write an if/else that checks if age >= 18
// Log "Adult" or "Minor"
const age = 16;
// Your code here:
if (age >= 18)
  console.log("Adult 18")

console.log('\n=== Exercise 2: if/else if/else ===');
// TODO: Convert score to grade (A:90+, B:80+, C:70+, D:60+, F:<60)
const score = 85;
// Your code here:
if (score >= 90)
  console.log("90+");
else if (score >= 80)
  console.log("80+");
else if (score >= 70)
  console.log("70+");
else if (score >= 60)
  console.log("60+");
else
  console.log("< 60");

console.log('\n=== Exercise 3: Ternary operator ===');
// TODO: Use ternary to set status to "Pass" or "Fail" (pass >= 60)
const testScore = 75;
// Your code here:
let passed = testScore >= 60 ? 'Pass' : "Fail";

console.log('\n=== Exercise 4: switch statement ===');
// TODO: Use switch to log the season based on month number
// 12,1,2: Winter | 3,4,5: Spring | 6,7,8: Summer | 9,10,11: Fall
const month = 6;
// Your code here:
let season;
switch (month) {
  case 12: case 1: case 2:
    season = 'Winter';
    break;
  case 3: case 4: case 5:
    season = 'Spring';
    break;
  case 6: case 7: case 8:
    season = 'Summer';
    break;
  case 9: case 10: case 11:
    season = 'Fall';
    break;
  default:
    season = 'Unknown';
    break;
}
console.log('Season: ', season);

console.log('\n=== Exercise 5: for loop ===');
// TODO: Use for loop to print numbers 1 to 10
// Your code here:
for (let i = 1; i <= 10; i++) {
  console.log(i);
}

console.log('\n=== Exercise 6: while loop ===');
// TODO: Use while loop to print even numbers from 0 to 10
// Your code here:
let i = 0;
while (i <= 10) {
  console.log(i);
  i += 2;
}

console.log('\n=== Exercise 7: for...of loop ===');
// TODO: Use for...of to iterate and log each fruit
const fruits = ['apple', 'banana', 'orange'];
// Your code here:
for (let fruit of fruits) {
  console.log(fruit);
}

console.log('\n=== Exercise 8: for...in loop ===');
// TODO: Use for...in to log all key-value pairs
const user = { name: 'Alice', age: 25, city: 'London' };
// Your code here:
for (let key in user) {
  console.log(`Key: ${key}, Value: ${user[key]}`);
}

console.log('\n=== Exercise 9: break statement ===');
// TODO: Loop through numbers 1-10, break when you find first number > 7
const numbers = [2, 4, 6, 9, 3, 8, 1];
// Your code here:
for (let num of numbers) {
  if (num > 7) {
    console.log(`Found ${num}. Breaking.`);
    break;
  }
}

console.log('\n=== Exercise 10: continue statement ===');
// TODO: Loop through 0-9, skip multiples of 3 using continue
// Your code here:
for (let num = 0; num <= 9; num++) {
  if (!num) continue;

  if (num % 3 === 0) {
    console.log(`Found ${num}. Skipping.`);
    continue;
  }
  console.log(num);
}

console.log('\n=== 🎯 Challenge: Nested loops ===');
// TODO: Create a multiplication table (1-5) using nested loops
// Expected output: 1x1=1, 1x2=2, ... 5x5=25
// Your code here:
const table_size = 5;
for (let i = 1; i <= table_size; i++) {
  for (let j = 1; j <= table_size; j++) {
    console.log(`${i}x${j}=${i * j}`);
  }
}

console.log('\n=== 🎯 Challenge: FizzBuzz ===');
// TODO: Print numbers 1-20, but:
// - For multiples of 3: print "Fizz"
// - For multiples of 5: print "Buzz"
// - For multiples of both: print "FizzBuzz"
// - Otherwise: print the number
// Your code here:
for (let i = 1; i <= 20; i++) {
  let res = '';
  res += i % 3 === 0 ? 'Fizz' : '';
  res += i % 5 === 0 ? 'Buzz' : '';
  res ||= i;
  console.log(res);
}

console.log('\n=== 🎯 Challenge: Find duplicates ===');
// TODO: Find and log all duplicate values in this array
const arr = [1, 2, 3, 2, 4, 5, 3, 6];
// Hint: Use nested loops or an object to track counts
// Your code here:
const map = {};
for (let num of arr) {
  map[num] = map[num] ?? 0;
  map[num]++;
}

for (let key in map) {
  if (map[key] > 1)
    console.log(`Duplicate: ${key}`);
}

console.log('\n=== 🎯 Challenge: Prime numbers ===');
// TODO: Write a function that checks if a number is prime
function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

// Test it (uncomment):
console.log(isPrime(7));  // true
console.log(isPrime(10)); // false
console.log(isPrime(13)); // true


console.log('\n=== 🎯 Challenge: Pyramid pattern ===');
// TODO: Print a pyramid pattern using loops
// *
// **
// ***
// ****
// *****
// Your code here:
const height = 9;
for (let i = 1; i <= height; i++) {
  const str = String('*').repeat(i);
  console.log(str);
}


console.log('\n✅ Exercises completed! Check your answers with a mentor.');
