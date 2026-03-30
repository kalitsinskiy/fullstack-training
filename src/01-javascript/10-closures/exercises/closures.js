// ============================================
// CLOSURES Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/10-closures/exercises/closures.js

console.log('=== Exercise 1: Basic closure ===');
// TODO: Create a function makeGreeter(name) that returns a function
// The returned function should log "Hello, [name]!"
function makeGreeter(name) {
  // Your code here
  return function () {
    console.log(`Hello, ${name}!`);
  };
}
const greetAlice = makeGreeter('Alice');
const greetBob = makeGreeter('Bob');
greetAlice(); // "Hello, Alice!"
greetBob(); // "Hello, Bob!"

console.log('\n=== Exercise 2: Counter with closure ===');
// TODO: Create a makeCounter() function that returns an object with:
// increment(), decrement(), and getValue() methods
// The count should be private (not accessible directly)
function makeCounter(initialValue = 0) {
  // Your code here
  let count = initialValue;
  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getValue() {
      return count;
    },
  };
}
const counter = makeCounter(10);
counter.increment();
counter.increment();
counter.decrement();
console.log(counter.getValue()); // 11
console.log(counter.count); // undefined (private!)

console.log('\n=== Exercise 3: Loop closure problem ===');
// TODO: Fix this code so it logs 0, 1, 2, 3, 4 (one per second)
// Currently logs 5, 5, 5, 5, 5
// Fix using let OR using a closure (IIFE)
for (let i = 0; i < 5; i++) {
  // BUG: This logs 5 five times instead of 0,1,2,3,4
  setTimeout(() => console.log(i), i * 100);
}
// Fix option 1: Change var to let
// Fix option 2: Use IIFE to capture i

console.log('\n=== Exercise 4: Function factory ===');
// TODO: Create a createValidator(min, max) factory
// Returns a function that checks if a number is within range
// The returned function should return true/false
function createValidator(min, max) {
  // Your code here
  return function (num) {
    return num >= min && num <= max;
  };
}
// const isValidAge = createValidator(0, 120);
// const isValidScore = createValidator(0, 100);
// console.log(isValidAge(25));    // true
// console.log(isValidAge(-1));    // false
// console.log(isValidScore(101)); // false

console.log('\n=== Exercise 5: Memoization ===');
// TODO: Implement a simple memoize function
// It should cache results of function calls
// Key hint: use a Map or plain object to store results
function memoize(fn) {
  // Your code here
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Test:
let callCount = 0;
const expensiveFn = memoize((n) => {
  callCount++;
  return n * n;
});
console.log(expensiveFn(5)); // 25 (computed)
console.log(expensiveFn(5)); // 25 (cached)
console.log(expensiveFn(10)); // 100 (computed)
console.log('Total calls:', callCount); // 2 (not 3!)

console.log('\n=== Exercise 6: Partial application ===');
// TODO: Implement partial(fn, ...args) that pre-fills some arguments
function partial(fn, ...presetArgs) {
  // Your code here
  return function (...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

function multiply(a, b, c) {
  return a * b * c;
}
const double = partial(multiply, 2, 1);
const triple = partial(multiply, 3, 1);
console.log(double(5)); // 10
console.log(triple(5)); // 15

console.log('\n=== Exercise 7: Once function ===');
// TODO: Create a once(fn) function that ensures fn is only called once
// Subsequent calls should return the result of the first call
function once(fn) {
  // Your code here
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      result = fn(...args);
      called = true;
    }
    return result;
  };
}

const initialize = once(() => {
  console.log('Initializing...');
  return { ready: true };
});
const r1 = initialize(); // logs "Initializing..."
const r2 = initialize(); // no log
const r3 = initialize(); // no log
console.log(r1 === r2); // true (same object)

console.log('\n=== Exercise 8: Private state module ===');
// TODO: Create a bankAccount module using closure
// It should have: deposit(amount), withdraw(amount), getBalance()
// Balance should not be directly accessible
function createBankAccount(initialBalance = 0) {
  // Your code here
  let balance = initialBalance;
  return {
    deposit(amount) {
      balance += amount;
    },
    withdraw(amount) {
      if (amount > balance) {
        console.log('Insufficient funds');
        return;
      }
      balance -= amount;
    },
    getBalance() {
      return balance;
    },
  };
}
const account = createBankAccount(100);
account.deposit(50);
account.withdraw(30);
console.log(account.getBalance()); // 120
console.log(account.balance); // undefined (private)
account.withdraw(200); // Should log: "Insufficient funds"

console.log('\n=== 🎯 Challenge: Debounce ===');
// TODO: Implement debounce(fn, delay)
// Returns a function that delays calling fn until after `delay` ms
// have passed since the last call
// Useful for search inputs, window resize, etc.
function debounce(fn, delay) {
  // Your code here
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const search = debounce((query) => {
  console.log('Searching for:', query);
}, 300);
search('j'); // cancelled
search('ja'); // cancelled
search('jav'); // cancelled
search('java'); // cancelled
setTimeout(() => search('javascript'), 400); // Logged after 700ms total

console.log('\n=== 🎯 Challenge: Compose functions ===');
// TODO: Implement compose(...fns) that creates a pipeline
// compose(f, g, h)(x) should equal f(g(h(x)))
// Functions are applied right to left
function compose(...fns) {
  // Your code here
  return function (initialValue) {
    return fns.reduceRight((acc, fn) => fn(acc), initialValue);
  };
}

const add1 = (x) => x + 1;
const doublee = (x) => x * 2;
const square = (x) => x * x;

const transform = compose(add1, doublee, square);
console.log(transform(3)); // add1(double(square(3))) = add1(double(9)) = add1(18) = 19

// Also implement pipe (left to right):
function pipe(...fns) {
  // Your code here
  return function (initialValue) {
    return fns.reduce((acc, fn) => fn(acc), initialValue);
  };
}
const transform2 = pipe(square, doublee, add1);
console.log(transform2(3)); // same result: 19

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
