// ============================================
// VARIABLES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/01-variables/exercises/variables.js

console.log('=== Exercise 1: Choose the right declaration ===');
// TODO: Declare a variable for a user's age that can change
// Your code here:
let age;

// TODO: Declare a variable for PI that should never change
// Your code here:
const mathPi = 3.14;

// TODO: Declare a variable for a counter in a loop
// Your code here:
let myCounter = 0; //initialized - declared and assigned to 0

console.log('\n=== Exercise 2: Fix the scope issue ===');
// TODO: Fix this code so 'result' is accessible outside the if block
// Hint: Move the declaration to the right scope
/*
if (true) {
  const result = 'Success';
}
console.log(result); // Should work after your fix
*/
// Your fixed code here:

if (true) {
  const result = 'Success';
  console.log(result);
}

//or

let result;
if (true) {
  result = 'Success';
}
console.log(result);

console.log('\n=== Exercise 3: Prevent reassignment ===');
// TODO: Change this code to prevent 'username' from being reassigned
/*
let username = 'Alice';
username = 'Bob'; // This should cause an error
*/
// Your code here:
const username = 'Alice';
//username = 'Bob'; //Error here

console.log('\n=== Exercise 4: Block scope practice ===');
// TODO: Predict the output, then uncomment and run
/*
const x = 1;

if (true) {
  const x = 2;
  console.log('Inside block:', x);
}

console.log('Outside block:', x);
*/
// Question: What will be printed? Why?
// Your answer:
// Will see in console 2 then 1, since x constants are in different scopes
// First will be printed number 2 inside 'if' block then 1 from global context

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

console.log('\n=== Exercise 6: Const with objects ===');
// TODO: Create a const object 'user' with name and age
// Then change the age (this should work!)
// Then try to reassign the entire object (this should fail!)
// Your code here:
const user = {
  name: 'Oleksandr',
  age: 39,
};

user.age = 40;
console.log(`User ${user.name} is ${user.age} old`);

//user = {name: 'Alex', age: 20}; //Error here

console.log('\n=== Exercise 7: Hoisting understanding ===');
// TODO: Explain what happens when you run this code (don't actually run it):
/*
console.log(a); // undefined
var a = 5;

console.log(b); // Error
let b = 10;
*/
// Your explanation:
// a will be: We should see 'undefined' in console, due to hoisting
// b will be: Initialization error, b called before declaration and assignment

console.log('\n=== Exercise 8: Function scope ===');
// TODO: Complete this function so 'secret' is private
// and cannot be accessed from outside
function createSecret() {
  // Your code here
  // Hint: declare a variable inside the function
  const secret = 'This is secret';
  return {
    getSecret() {
      return secret;
    },
  };
}

const mySecret = createSecret();
console.log(mySecret.getSecret()); // Should work
//console.log(secret); // Should fail

console.log('\n=== Exercise 9: Temporal Dead Zone ===');
// TODO: Explain why this code throws an error:
/*
function test() {
  console.log(x); // ReferenceError
  let x = 5;
}
*/
// Your explanation: x is called before initialization, dead zone here starts
// from top of the block to the place where x will be initialized

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
const USERDATA = {
  n: 'John',
  a: 25,
};

let message;
if (USERDATA.a >= 18) {
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
    increment() {
      count++;
    },
    getValue() {
      return count;
    },
  };
}
const newCounter = createCounter();
newCounter.increment();
newCounter.increment();
console.log(newCounter.getValue()); // 2
console.log(newCounter.count); // undefined (private!)

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
