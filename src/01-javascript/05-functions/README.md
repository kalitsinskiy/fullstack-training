# Functions in JavaScript

## Quick Overview

Functions are reusable blocks of code that perform specific tasks.

**Three ways to create functions:**
- **Function Declaration** - traditional way with `function` keyword
- **Function Expression** - function as a value
- **Arrow Function** - modern, concise syntax with `=>`

## Key Concepts

### Function Declaration

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

- Hoisted (can be called before definition)
- Has its own `this` context
- Named function

### Function Expression

```javascript
const greet = function(name) {
  return `Hello, ${name}!`;
};
```

- Not hoisted (must be defined before use)
- Can be anonymous or named
- Assigned to a variable

### Arrow Function

```javascript
const greet = (name) => `Hello, ${name}!`;
```

- Concise syntax
- No own `this` (inherits from parent)
- Always anonymous
- Implicit return for single expressions

### Higher-Order Functions

Functions that take other functions as arguments or return functions:

```javascript
function withLogging(fn) {
  return function(...args) {
    console.log('Calling function...');
    return fn(...args);
  };
}
```

### Callbacks

Functions passed as arguments to be called later:

```javascript
function processData(data, callback) {
  const result = data * 2;
  callback(result);
}

processData(5, (result) => console.log(result)); // 10
```

## When to Use Each

- **Function Declaration**: Regular functions, especially when hoisting is useful
- **Function Expression**: When you need a function as a value
- **Arrow Function**: Short callbacks, array methods, when you need lexical `this`

## Learn More

- [MDN: Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN: Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [JavaScript.info: Functions](https://javascript.info/function-basics)
- [MDN: Higher-order functions](https://eloquentjavascript.net/05_higher_order.html)
- [JavaScript.info: Callbacks](https://javascript.info/callbacks)

## How to Work

1. **Study examples**: Run `node src/1-javascript/03-functions/examples/<file>.js`
2. **Complete exercises**: Open `exercises/functions.js` and write code

