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
if (age >= 18) {
  console.log('Adult');
} else {
  console.log('Minor');
}

console.log('\n=== Exercise 2: if/else if/else ===');
// TODO: Convert score to grade (A:90+, B:80+, C:70+, D:60+, F:<60)
const score = 85;
// Your code here:
if (score >= 90) {
  console.log('Grade: A');
} else if (score >= 80) {
  console.log('Grade: B');
} else if (score >= 70) {
  console.log('Grade: C');
} else if (score >= 60) {
  console.log('Grade: D');
} else {
  console.log('Grade: F');
}

console.log('\n=== Exercise 3: Ternary operator ===');
// TODO: Use ternary to set status to "Pass" or "Fail" (pass >= 60)
const testScore = 75;
// Your code here:
console.log(testScore >= 60 ? 'Pass' : 'Fail');

console.log('\n=== Exercise 4: switch statement ===');
// TODO: Use switch to log the season based on month number
// 12,1,2: Winter | 3,4,5: Spring | 6,7,8: Summer | 9,10,11: Fall
const month = 6;
// Your code here:
switch (month) {
  case 12:
  case 1:
  case 2:
    console.log('Winter');
    break;
  case 3:
  case 4:
  case 5:
    console.log('Spring');
    break;
  case 6:
  case 7:
  case 8:
    console.log('Summer');
    break;
  case 9:
  case 10:
  case 11:
    console.log('Fall');
    break;
  default:
    console.log('Error: Unknown month');
    break;
}

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
  if (i % 2 === 0) {
    console.log(i);
  }
  i++;
}

console.log('\n=== Exercise 7: for...of loop ===');
// TODO: Use for...of to iterate and log each fruit
const fruits = ['apple', 'banana', 'orange'];
// Your code here:
for (const fruit of fruits) {
  console.log(fruit);
}

console.log('\n=== Exercise 8: for...in loop ===');
// TODO: Use for...in to log all key-value pairs
const user = { name: 'Alice', age: 25, city: 'London' };
// Your code here:
for (const key in user) {
  console.log(`${key}: ${user[key]}`);
}

console.log('\n=== Exercise 9: break statement ===');
// TODO: Loop through numbers 1-10, break when you find first number > 7
const numbers = [2, 4, 6, 9, 3, 8, 1];
// Your code here:
for (const number of numbers) {
  if (number > 7) {
    console.log(' First number > 7:', number);
    break;
  }
}

console.log('\n=== Exercise 10: continue statement ===');
// TODO: Loop through 0-9, skip multiples of 3 using continue
// Your code here:
for (let i = 0; i < 10; i++) {
  if (i % 3 === 0) {
    continue;
  }
  console.log(i);
}

console.log('\n=== 🎯 Challenge: Nested loops ===');
// TODO: Create a multiplication table (1-5) using nested loops
// Expected output: 1x1=1, 1x2=2, ... 5x5=25
// Your code here:
for (let i = 1; i <= 5; i++) {
  for (let j = 1; j <= 5; j++) {
    console.log(`${i} x ${j} = ${i * j}`);
  }
  i < 5 && console.log('----------');
}

console.log('\n=== 🎯 Challenge: FizzBuzz ===');
// TODO: Print numbers 1-20, but:
// - For multiples of 3: print "Fizz"
// - For multiples of 5: print "Buzz"
// - For multiples of both: print "FizzBuzz"
// - Otherwise: print the number
// Your code here:
for (let i = 1; i <= 20; i++) {
  if (i % 3 === 0 && i % 5 === 0) {
    console.log('FizzBuzz');
  } else if (i % 3 === 0) {
    console.log('Fizz');
  } else if (i % 5 === 0) {
    console.log('Buzz');
  } else {
    console.log(i);
  }
}

console.log('\n=== 🎯 Challenge: Find duplicates ===');
// TODO: Find and log all duplicate values in this array
const arr = [1, 2, 3, 2, 4, 5, 3, 6];
// Hint: Use nested loops or an object to track counts
// Your code here:
const duplications = [];
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[i] === arr[j] && !duplications.includes(arr[i])) {
      duplications.push(arr[i]);
    }
  }
}
console.log('Duplications:', duplications);

console.log('\n=== 🎯 Challenge: Prime numbers ===');
// TODO: Write a function that checks if a number is prime
function isPrime(num) {
  // Your code here
  if (num <= 1) return false;
  for (let i = 2; i <= num; i++) {
    if (num % i === 0 && num !== i) {
      return false;
    }
  }

  return true;
}

// Test it (uncomment):
console.log(isPrime(7)); // true
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
const printPyramid = (levels) => {
  console.log('\nUsing repeat');
  for (let i = 1; i <= levels; i++) {
    console.log('*'.repeat(i));
  }

  console.log('\nUsing nested loops');
  for (let i = 1; i <= levels; i++) {
    let row = '';

    for (let j = 0; j < i; j++) {
      row += '*';
    }

    console.log(row);
  }
};

printPyramid(10);

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
