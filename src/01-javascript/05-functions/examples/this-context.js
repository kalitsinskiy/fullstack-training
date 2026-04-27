// ============================================
// THIS CONTEXT, call, apply, bind Examples
// ============================================

console.log('=== 1. What is "this"? ===');

// 'this' refers to the object that is CALLING the function
// Its value depends on HOW the function is called — not where it's defined

const person = {
  name: 'Alice',
  greet() {
    console.log(`Hi, I'm ${this.name}`); // 'this' = person object
  },
};

person.greet(); // 'Hi, I'm Alice'

// 'this' in global context (non-strict mode) = global object (window in browser / {} in Node.js)
function showThis() {
  console.log('this in function:', typeof this); // 'object' (global) or 'undefined' in strict mode
}
showThis();

console.log('\n=== 2. "this" in different contexts ===');

const calculator = {
  value: 0,
  add(n) {
    this.value += n; // 'this' = calculator
    return this; // return this for chaining
  },
  subtract(n) {
    this.value -= n;
    return this;
  },
  result() {
    return this.value;
  },
};

console.log(calculator.add(10).add(5).subtract(3).result()); // 12

// 'this' inside class methods
class Counter {
  constructor() {
    this.count = 0; // 'this' = instance being created
  }
  increment() {
    this.count++; // 'this' = the Counter instance
    return this;
  }
  getValue() {
    return this.count;
  }
}

const c = new Counter();
console.log(c.increment().increment().getValue()); // 2

console.log('\n=== 3. Context Loss — the common bug ===');

const user = {
  name: 'Bob',
  greet() {
    console.log(`Hello, ${this.name}`);
  },
};

// ✅ Works — called as a method of user
user.greet(); // 'Hello, Bob'

// ❌ Context lost — function extracted from object
const greetFn = user.greet;
greetFn(); // 'Hello, undefined' — 'this' is now global/undefined

// ❌ Context lost — passed as callback
setTimeout(user.greet, 0); // 'Hello, undefined'
[1].forEach(user.greet); // 'Hello, undefined'

// WHY: When you pass user.greet, you're passing just the function.
// The connection to 'user' is lost. It's like doing:
// const fn = function() { console.log(this.name); }
// fn(); ← no object context

console.log('\n=== 4. call() — invoke with specific "this" ===');

// fn.call(thisArg, arg1, arg2, ...)
// Calls the function immediately with 'this' set to thisArg

function introduce(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const alice = { name: 'Alice' };
const bob = { name: 'Bob' };

introduce.call(alice, 'Hello', '!'); // "Hello, I'm Alice!"
introduce.call(bob, 'Hi', '.'); // "Hi, I'm Bob."

// Borrow a method from another object
const admin = {
  name: 'Admin',
  getRole() {
    return 'admin';
  },
};

const regularUser = { name: 'Charlie' };
// Charlie doesn't have getRole, but we can borrow admin's:
const role = admin.getRole.call(regularUser);
console.log('Borrowed role:', role); // 'admin'

// Practical: use Array methods on array-like objects
function showArgs() {
  // 'arguments' is array-like but not a real Array
  const argsArray = Array.prototype.slice.call(arguments);
  console.log('Args as array:', argsArray);
}
showArgs(1, 2, 3); // [1, 2, 3]

console.log('\n=== 5. apply() — same as call, but args as array ===');

// fn.apply(thisArg, [arg1, arg2, ...])
// Identical to call(), but arguments passed as an array

introduce.apply(alice, ['Howdy', '?']); // "Howdy, I'm Alice?"
introduce.apply(bob, ['Hey', '...']); // "Hey, I'm Bob..."

// Useful when you already have args in an array
const args = ['Greetings', '!!'];
introduce.apply(alice, args);

// Classic use: Math.max with an array
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
console.log('Max (apply):', Math.max.apply(null, numbers)); // 9
// Modern equivalent: Math.max(...numbers)
console.log('Max (spread):', Math.max(...numbers)); // 9

// call vs apply summary:
// fn.call(this, a, b, c)    — args listed individually
// fn.apply(this, [a, b, c]) — args in array
// In modern JS: prefer call or spread, apply is rarely needed

console.log('\n=== 6. bind() — create a new function with fixed "this" ===');

// fn.bind(thisArg, arg1, arg2, ...)
// Does NOT call the function — returns a NEW function with 'this' permanently fixed

function greetUser(greeting) {
  console.log(`${greeting}, ${this.name}!`);
}

const aliceGreet = greetUser.bind(alice); // New function, 'this' always = alice
const bobGreet = greetUser.bind(bob); // New function, 'this' always = bob

aliceGreet('Hello'); // 'Hello, Alice!'
bobGreet('Hi'); // 'Hi, Bob!'

// Can also pre-fill arguments (partial application)
const sayHelloToAlice = greetUser.bind(alice, 'Hello');
sayHelloToAlice(); // 'Hello, Alice!'

// Fix context loss with bind
const user2 = {
  name: 'Eve',
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

const fixedGreet = user2.greet.bind(user2); // 'this' is locked to user2
setTimeout(fixedGreet, 0); // ✅ Works: 'Hi, I'm Eve'
[1].forEach(fixedGreet); // ✅ Works: 'Hi, I'm Eve'

console.log('\n=== 7. Arrow Functions and "this" ===');

// Arrow functions DON'T have their own 'this'
// They INHERIT 'this' from the surrounding lexical scope (where they are defined)

class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // ❌ Regular function — 'this' changes inside the callback
    // setInterval(function() {
    //   this.seconds++; // ← 'this' is global, not Timer instance!
    // }, 1000);

    // ✅ Arrow function — inherits 'this' from start() method
    setInterval(() => {
      this.seconds++; // 'this' = Timer instance (correct!)
    }, 1000);
  }
}

// The difference:
const obj = {
  name: 'Object',

  // Regular method — 'this' depends on caller
  regularMethod: function () {
    console.log('Regular:', this.name);

    const innerRegular = function () {
      console.log('  Inner regular:', this?.name); // undefined — lost context
    };
    innerRegular();

    const innerArrow = () => {
      console.log('  Inner arrow:', this.name); // 'Object' — inherits from method
    };
    innerArrow();
  },

  // Arrow method — inherits 'this' from where obj is defined (global)
  arrowMethod: () => {
    console.log('Arrow method:', this?.name); // undefined — captured global 'this'
  },
};

obj.regularMethod();
obj.arrowMethod();

// Rule: Arrow functions are great for CALLBACKS inside methods.
//       Regular functions are better for METHODS themselves.

console.log('\n=== 8. Fixing Context Loss — all 3 ways ===');

class Button {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;
  }

  // Option 1: Arrow function as class field (modern, preferred)
  handleClickArrow = () => {
    this.clickCount++;
    console.log(`[Arrow] ${this.label} clicked ${this.clickCount} times`);
  };

  // Option 2: bind in constructor
  constructor2() {
    this.handleClickBind = this.handleClickBind.bind(this);
  }

  handleClickBind() {
    this.clickCount++;
    console.log(`[Bind] ${this.label} clicked ${this.clickCount} times`);
  }

  // Option 3: Wrapper arrow in the call site
  handleClickRegular() {
    this.clickCount++;
    console.log(`[Regular] ${this.label} clicked ${this.clickCount} times`);
  }
}

const btn = new Button('Submit');

// Option 1: class field arrow — works directly
btn.handleClickArrow();
setTimeout(btn.handleClickArrow, 0); // ✅ Works

// Option 3: wrapper arrow at call site
setTimeout(() => btn.handleClickRegular(), 0); // ✅ Works

console.log('\n=== Summary: call vs apply vs bind ===\n');
console.log('call(thisArg, a, b)     — calls immediately, args listed');
console.log('apply(thisArg, [a, b])  — calls immediately, args in array');
console.log('bind(thisArg)           — returns new function, does not call');
console.log('Arrow function          — inherits this, cannot be changed');

console.log('\n=== Best Practices ===');
console.log('1. Use arrow functions for callbacks inside class methods');
console.log(
  '2. Use bind() when passing methods as callbacks (event listeners)'
);
console.log(
  '3. call/apply are mainly used to borrow methods from other objects'
);
console.log(
  '4. Prefer arrow class fields (handleClick = () => {}) over bind in constructor'
);
console.log('5. Know that context loss is one of the most common JS bugs');
console.log(
  '6. Use arrow functions for array callbacks (map, filter, forEach)'
);
