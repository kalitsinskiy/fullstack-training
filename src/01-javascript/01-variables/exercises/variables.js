// ============================================
// VARIABLES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/01-variables/exercises/variables.js

console.log('=== Exercise 1: Choose the right declaration ===');
// TODO: Declare a variable for a user's age that can change
// Your code here:
let userAge = 30;
console.log('User age:', userAge);

// TODO: Declare a variable for PI that should never change
// Your code here:
const PI = Math.PI;
console.log('PI:', PI);

// TODO: Declare a variable for a counter in a loop
// Your code here:
for (let i = 0; i < 5; i++) {
  console.log('Counter:', i);
}

console.log('\n=== Exercise 2: Fix the scope issue ===');
// TODO: Fix this code so 'result' is accessible outside the if block
/*
if (true) {
  const result = 'Success';
}
console.log(result); // Should work after your fix
*/
// Your fixed code here:

let result = 'False';

if (true) {
  result = 'Success';
}
console.log(result); // Should work after your fix

console.log('\n=== Exercise 3: Prevent reassignment ===');
// TODO: Change this code to prevent 'username' from being reassigned
/*
let username = 'Alice';
username = 'Bob'; // This should cause an error
*/
// Your code here:
const username = 'Alice';
// username = 'Bob'; // This should cause an error

console.log('\n=== Exercise 4: Block scope practice ===');

// TODO: Predict the output, then uncomment and run

const x = 1;

if (true) {
  const x = 2;
  console.log('Inside block:', x);
}

console.log('Outside block:', x);

// Question: What will be printed? Why?
// Your answer:

console.log('Inside block: 2');
console.log('Outside block: 1');

console.log('\n=== Exercise 5: Loop scope ===');
// TODO: Fix this loop so each timeout prints the correct number (0, 1, 2)
// Hint: Change var to let
/*
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // Currently prints 3, 3, 3
  }, 100);
}
*/
// Your fixed code here:
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}

for (var i = 0; i < 3; i++) {
  (function (iCopy) {
    setTimeout(() => {
      console.log('iCopy:', iCopy);
    }, 100);
  })(i);
}

console.log('\n=== Exercise 6: Const with objects ===');
// TODO: Create a const object 'user' with name and age
// Then change the age (this should work!)
// Then try to reassign the entire object (this should fail!)
// Your code here:
const user = {
  name: 'John',
  age: 30,
};
console.log('Original user:', user);

user.age = 31;
console.log('Updated user:', user);
// user = { name: 'Jane', age: 25 }; // This should fail

console.log('\n=== Exercise 7: Hoisting understanding ===');
// TODO: Explain what happens when you run this code (don't actually run it):
/*
console.log(a); // ?
var a = 5;

console.log(b); // ?
let b = 10;
*/
// Your explanation:
// a will be: undefined (because of hoisting, var declarations are moved to the top but not the assignment)
// b will be: ReferenceError: Cannot access 'b' before initialization (because of temporal dead zone)

console.log('\n=== Exercise 8: Function scope ===');
// TODO: Complete this function so 'secret' is private
// and cannot be accessed from outside
function createSecret() {
  // Your code here
  // Hint: declare a variable inside the function
  let secret = 'This is a secret!';
  return {
    getSecret: () => secret,
  };
}

const mySecret = createSecret();
console.log(mySecret.getSecret()); // Should work
// console.log(secret); // Should fail

console.log('\n=== Exercise 9: Temporal Dead Zone ===');
// TODO: Explain why this code throws an error:

function test() {
  console.log(x); // ReferenceError
  let x = 5;
}

// test();

// Your explanation: reference error occurs because x is in the temporal dead zone until it is declared and initialized. The console.log tries to access x before it has been initialized, which causes the error.

console.log('\n=== Exercise 10: Best practices ===');
// TODO: Refactor this code following best practices
// (use const/let instead of var, proper naming, etc.)
/*
var USERDATA = {
  n: 'John',
  a: 25
};

var message;
if (USERDATA.a >= 18) {
  message = 'Adult';
} else {
  message = 'Minor';
}

var counter = 0;
for (var i = 0; i < 5; i++) {
  counter = counter + 1;
}
*/
// Your refactored code here:
const userData = {
  name: 'John',
  age: 25,
};

let message;
if (userData.age >= 18) {
  message = 'Adult';
} else {
  message = 'Minor';
}

let counter = 0;
for (let i = 0; i < 5; i++) {
  counter = counter + 1;
}

console.log('\n=== 🎯 Challenge: Create a counter with closure ===');
// TODO: Create a function that returns an object with increment and getValue methods
// The count should be private (not accessible from outside)
// Example usage:
// const counter = createCounter();
// counter.increment();
// counter.increment();
// console.log(counter.getValue()); // 2
// console.log(counter.count); // undefined (private!)

// Your code here:
function createCounter() {
  let count = 0;
  return {
    increment: () => {
      count++;
    },
    decrement: () => {
      count--;
    },
    getValue: () => {
      return count;
    },
  };
}

const counter1 = createCounter();
counter1.increment();
counter1.increment();
console.log(counter1.getValue()); // 2
console.log(counter1.count); // undefined (private!)
console.log('\n✅ Exercises completed! Check your answers with a mentor.');
