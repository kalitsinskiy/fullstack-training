# Control Flow in JavaScript

## Quick Overview

Control flow determines the order in which code executes. Use conditionals to make decisions and loops to repeat actions.

## Key Concepts

### Conditionals

```javascript
// if/else
if (age >= 18) {
  console.log('Adult');
} else {
  console.log('Minor');
}

// else if
if (score >= 90) {
  console.log('A');
} else if (score >= 80) {
  console.log('B');
} else {
  console.log('C');
}

// Ternary operator
const status = age >= 18 ? 'Adult' : 'Minor';

// switch statement
switch (day) {
  case 'Monday':
    console.log('Start of week');
    break;
  case 'Friday':
    console.log('Almost weekend');
    break;
  default:
    console.log('Regular day');
}
```

### Loops

```javascript
// for loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// while loop
let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}

// do...while loop (executes at least once)
do {
  console.log(i);
  i++;
} while (i < 5);

// for...of (arrays)
for (const item of array) {
  console.log(item);
}

// for...in (objects)
for (const key in object) {
  console.log(key, object[key]);
}
```

### Control Statements

- `break` - exit loop/switch
- `continue` - skip to next iteration
- `return` - exit function

## When to Use Each

- **if/else**: Complex conditions, multiple branches
- **ternary**: Simple conditions, inline expressions
- **switch**: Many possible values for single variable
- **for**: Known number of iterations
- **while**: Unknown number of iterations
- **for...of**: Iterate array values
- **for...in**: Iterate object keys (use with caution)

## Learn More

- [MDN: Control flow](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [MDN: Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- [JavaScript.info: Conditionals](https://javascript.info/ifelse)
- [JavaScript.info: Loops](https://javascript.info/while-for)

## How to Work

1. **Study examples**: Run `node src/01-javascript/03-control-flow/examples/<file>.js`
2. **Complete exercises**: Open `exercises/control-flow.js` and write code
