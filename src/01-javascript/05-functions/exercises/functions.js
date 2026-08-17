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
function declSquare(x) {
  return x * x;
}
const exprSquare = function (x) {
  return x * x;
};

const arrowSquare = (x) => x * x;

console.log(declSquare(2));
console.log(exprSquare(3));
console.log(arrowSquare(4));

console.log('\n=== Exercise 2: Default parameters ===');
// TODO: Create a function 'greet' that takes name and greeting
// Default greeting should be "Hello"
// greet("Alice") should return "Hello, Alice!"
// greet("Bob", "Hi") should return "Hi, Bob!"
// Your code here:
const greet = function (name = '', greeting = 'Hello') {
  console.log(`${greeting} ${name}`);
};
greet('Alice');
greet('Bob', 'Hi');
greet();

console.log('\n=== Exercise 3: Rest parameters ===');
// TODO: Create a function that calculates average of any number of arguments
// average(1, 2, 3) should return 2
// average(10, 20, 30, 40) should return 25
// Your code here:
const average = function (...args) {
  const numbers = [...args];
  console.log(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
};
average(1, 2, 3);
average(10, 20, 30, 40);

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
person.greet(); // Should print "Hello, I'm Alice"
//Arrow functions do not have their own 'this' context, inherits 'this' from parent

console.log('\n=== Exercise 5: Higher-order function ===');
// TODO: Create a function 'repeat' that takes a function and a number
// It should call the function n times
// Example: repeat(() => console.log('Hi'), 3) prints "Hi" three times
// Your code here:
const repeat = function (fn, n) {
  for (let i = 0; i < n; i++) {
    fn();
  }
};

const sayHi = () => console.log('Hi');

repeat(sayHi, 3);

console.log('\n=== Exercise 6: Function that returns function ===');
// TODO: Create a function 'createAdder' that returns a function
// const add5 = createAdder(5);
// add5(10) should return 15
// add5(20) should return 25
// Your code here:
const createAdder = function () {
  return function (n) {
    return n + 5;
  };
};

const add5 = createAdder();
console.log(add5(10));
console.log(add5(20));

console.log('\n=== Exercise 7: Array methods with callbacks ===');
// TODO: Use map, filter, and reduce to:
// 1. Double each number
// 2. Keep only numbers > 5
// 3. Sum the remaining numbers
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// Your code here:
const myFunc = function (callback, array) {
  return callback(array);
};
const double = function (array) {
  return array.map((i) => i * i);
};
const filter = function (array) {
  return array.filter((i) => i > 5);
};
const reduce = function (array) {
  return array.reduce((sum, n) => sum + n, 0);
};

const res1 = myFunc(double, numbers);
const res2 = myFunc(filter, numbers);
const res3 = myFunc(reduce, numbers);

console.log(res1);
console.log(res2);
console.log(res3);

console.log('\n=== Exercise 8: Callback pattern ===');
// TODO: Create a function 'processArray' that takes an array and a callback
// It should apply the callback to each element and return new array
// processArray([1,2,3], x => x * 2) should return [2, 4, 6]
// Your code here:
const processArray = function (array, callback) {
  return array.map(callback);
};

const res4 = processArray([1, 2, 3], (x) => x * 2);

console.log(res4);

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

const counter1 = createCounter();

counter1.increment();
counter1.increment();
counter1.increment();
counter1.decrement();
console.log(counter1.getValue());

counter1.reset();
console.log(counter1.getValue());

console.log('\n=== Exercise 10: Pure function ===');
// TODO: Rewrite this IMPURE function as a PURE function
/*
let discount = 0.1;
function calculatePrice(price) {
  return price - (price * discount);
}
*/
// Your pure version here (hint: pass discount as parameter):
let discount = 0.1;

function calculatePrice(price, discount) {
  return price - price * discount;
}
const res5 = calculatePrice(100, discount);

console.log(res5);

console.log('\n=== 🎯 Challenge: Curry function ===');
// TODO: Create a curry function that transforms a function
// taking multiple arguments into a sequence of functions
// each taking a single argument
// Example:
function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); //should return 6
console.log(curriedAdd(1, 2)(3)); //should also return 6
// Your code here:
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return function (...nextArgs) {
      return curried(...args, ...nextArgs);
    };
  };
}

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
