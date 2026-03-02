# Closures in JavaScript

## Quick Overview

A closure is a function that **remembers the variables from its outer scope** even after the outer function has returned. This is one of JavaScript's most powerful (and initially confusing) features.

```javascript
function makeCounter() {
  let count = 0; // This variable is "closed over"

  return function() {
    return ++count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3  — count persists!
```

## Key Concepts

### Lexical Scope

Functions in JavaScript see variables from where they are **defined** (not where they are called):

```javascript
const x = 10;

function outer() {
  const y = 20;

  function inner() {
    console.log(x, y); // sees both!
  }

  inner();
}
```

### Closure = Function + Environment

Every function "closes over" all variables visible at the time of its creation.

### Private Variables with Closures

```javascript
function createWallet(initial) {
  let balance = initial; // private!

  return {
    deposit(amount) { balance += amount; },
    withdraw(amount) { balance -= amount; },
    getBalance() { return balance; }
  };
}

const wallet = createWallet(100);
wallet.deposit(50);
console.log(wallet.getBalance()); // 150
// console.log(balance); // ReferenceError! private
```

### Common Patterns

- **Factory functions** — create similar objects with private state
- **Memoization** — cache expensive function results
- **Partial application** — pre-fill some arguments

## Learn More

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [JavaScript.info: Closures](https://javascript.info/closure)
- [MDN: Variable scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variable_scope)

## How to Work

1. **Study examples**: Run `node src/1-javascript/11-closures/examples/<file>.js`
2. **Complete exercises**: Open `exercises/closures.js` and write code

