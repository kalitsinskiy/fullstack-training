// ============================================
// FUNCTIONS Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/05-functions/exercises/functions.js

console.log('=== Exercise 1: Function types ===');
// TODO: Create three versions of a function that squares a number
// 1. Function declaration
// 2. Function expression
// 3. Arrow function
// Your code here:
function square(x) {
  return x * x;
}

const square1 = function (x) {
  return x * x;
};

const square2 = (x) => x * x;
console.log('square(5):', square(5));
console.log('square1(5):', square1(5));
console.log('square2(5):', square2(5));

console.log('\n=== Exercise 2: Default parameters ===');
// TODO: Create a function 'greet' that takes name and greeting
// Default greeting should be "Hello"
// greet("Alice") should return "Hello, Alice!"
// greet("Bob", "Hi") should return "Hi, Bob!"
// Your code here:
function greet(name, greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

console.log(greet('Alice'));
console.log(greet('Bob', 'Hi'));

console.log('\n=== Exercise 3: Rest parameters ===');
// TODO: Create a function that calculates average of any number of arguments
// average(1, 2, 3) should return 2
// average(10, 20, 30, 40) should return 25
// Your code here:
function average(...numbers) {
  const sum = numbers.reduce((total, n) => total + n, 0);
  return sum / numbers.length;
}

console.log('average(1, 2, 3):', average(1, 2, 3));
console.log('average(10, 20, 30, 40):', average(10, 20, 30, 40));

console.log('\n=== Exercise 4: Arrow function this ===');

// TODO: Fix this code so the arrow function can access the name property
/*
const person = {
  name: 'Alice',
  greet: () => {
    console.log(`Hello, I'm ${this.name}`);
  }
};
person.greet(); // Should print "Hello, I'm Alice"
*/
// Your fixed code here:
const person = {
  name: 'Alice',
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  },
};

person.greet();

console.log('\n=== Exercise 5: Higher-order function ===');
// TODO: Create a function 'repeat' that takes a function and a number
// It should call the function n times
// Example: repeat(() => console.log('Hi'), 3) prints "Hi" three times
// Your code here:
function repeat(action, n) {
  for (let i = 0; i < n; i++) {
    action();
  }
}

repeat(() => console.log('Hi'), 3);

console.log('\n=== Exercise 6: Function that returns function ===');
// TODO: Create a function 'createAdder' that returns a function
// const add5 = createAdder(5);
// add5(10) should return 15
// add5(20) should return 25
// Your code here:
function createAdder(x) {
  return function (y) {
    return x + y;
  };
}

const add5 = createAdder(5);
console.log('add5(10):', add5(10));
console.log('add5(20):', add5(20));

console.log('\n=== Exercise 7: Array methods with callbacks ===');
// TODO: Use map, filter, and reduce to:
// 1. Double each number
// 2. Keep only numbers > 5
// 3. Sum the remaining numbers
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// Your code here:
const result = numbers
  .map((n) => n * 2)
  .filter((n) => n > 5)
  .reduce((total, n) => total + n, 0);

console.log('Result:', result);

console.log('\n=== Exercise 8: Callback pattern ===');
// TODO: Create a function 'processArray' that takes an array and a callback
// It should apply the callback to each element and return new array
// processArray([1,2,3], x => x * 2) should return [2, 4, 6]
// Your code here:
function processArray(array, callback) {
  return array.map(callback);
}

const processed = processArray([1, 2, 3], (x) => x * 2);
console.log('Processed Array:', processed);

console.log('\n=== Exercise 9: bind / call / apply ===');
// TODO: Given the function and the object below, call greet so that
// `this` inside it points to `user` — using each of: call, apply, bind
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}
const user = { name: 'Alice' };
// Use call:
// Use apply:
// Use bind (then invoke the bound function):
// All three should produce: "Hello, Alice!"

console.log('\n=== Exercise 9: Closure ===');
// TODO: Create a function 'createCounter' that returns an object with:
// - increment(): increases counter and returns new value
// - decrement(): decreases counter and returns new value
// - reset(): resets counter to 0
// - getValue(): returns current value
// The counter should be private (not accessible from outside)
// Your code here:
function createCounter() {
  let count = 0;

  return {
    increment() {
      count++;
    },
    decrement() {
      count--;
    },
    reset() {
      count = 0;
    },
    getValue() {
      return count;
    },
  };
}

const counter = createCounter();
console.log('Initial:', counter.getValue());
counter.increment();
counter.increment();
counter.increment();
console.log('After incrementing', counter.getValue());
counter.decrement();
console.log('After decrementing', counter.getValue());
counter.reset();
console.log('After reset', counter.getValue());

console.log('\n=== Exercise 10: Pure function ===');
// TODO: Rewrite this IMPURE function as a PURE function
/*
let discount = 0.1;
function calculatePrice(price) {
  return price - (price * discount);
}
*/
// Your pure version here (hint: pass discount as parameter):

function calculatePrice(price, discount) {
  return price - price * discount;
}

console.log('Price on sale:', calculatePrice(100, 0.1));

console.log('\n=== 🎯 Challenge: Function composition ===');
// TODO: Create a compose function that takes multiple functions
// and returns a new function that applies them right-to-left
// Example:
// const add1 = x => x + 1;
// const double = x => x * 2;
// const add1ThenDouble = compose(double, add1);
// add1ThenDouble(5) should return 12 // (5 + 1) * 2
// Your code here:
function compose(f, g) {
  return function (x) {
    return f(g(x));
  };
}

const add = (x) => x + 1;
const double = (x) => x * 2;
const addThenDouble = compose(double, add);
console.log('addThenDouble(5):', addThenDouble(5));

console.log('\n=== 🎯 Challenge: Debounce ===');
// TODO: Create a debounce function that delays function execution
// until after a certain time has passed since the last call
// This is commonly used for search inputs
// Example:
// const debouncedLog = debounce(console.log, 1000);
// debouncedLog('a'); // Waits 1 second
// debouncedLog('b'); // Cancels previous, waits 1 second
// debouncedLog('c'); // Cancels previous, waits 1 second
// Only 'c' gets logged after 1 second

function debounce(func, delay) {
  // Your code here
  // Hint: use setTimeout and clearTimeout
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// Test it (uncomment):
const debouncedLog = debounce((msg) => console.log('Logged:', msg), 1000);
debouncedLog('First');
debouncedLog('Second');
debouncedLog('Third'); // Only this should execute after 1 second

console.log('\n=== 🎯 Challenge: Curry function ===');
// TODO: Create a curry function that transforms a function
// taking multiple arguments into a sequence of functions
// each taking a single argument
// Example:
// function add(a, b, c) { return a + b + c; }
// const curriedAdd = curry(add);
// curriedAdd(1)(2)(3) should return 6
// curriedAdd(1, 2)(3) should also return 6
// Your code here:

function curryTransform(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }

    return function (...moreArgs) {
      return curried(...args, ...moreArgs);
    };
  };
}

function addFn(a, b, c) {
  return a + b + c;
}

const curriedAdd = curryTransform(addFn);
console.log('curriedAdd(1)(2)(3)', curriedAdd(1)(2)(3));
console.log('curriedAdd(1, 2)(3)', curriedAdd(1, 2)(3));

console.log('\n=== 🎯 Challenge: Memoization ===');
// TODO: Create a memoize function that caches function results
// to avoid expensive recalculations
// Example:
// function slowFib(n) {
//   if (n <= 1) return n;
//   return slowFib(n - 1) + slowFib(n - 2);
// }
// const fastFib = memoize(slowFib);
// fastFib(40) // Fast after first call

function memoize(func) {
  // Your code here
  // Hint: use an object to store results
  const cache = {};

  return function (arg) {
    const key = arg.toString();

    if (cache[key]) {
      return cache[key];
    }

    const result = func(arg);
    cache[key] = result;

    return result;
  };
}

// Test it (uncomment):
function expensive(n) {
  console.log('Computing...');

  return n * 2;
}
const memoized = memoize(expensive);
console.log(memoized(5)); // Logs "Computing..." then 10
console.log(memoized(5)); // Just returns 10 (no "Computing...")
console.log(memoized(10)); // Logs "Computing..." then 20

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
