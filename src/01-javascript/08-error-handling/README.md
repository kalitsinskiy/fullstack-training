# Error Handling in JavaScript

## Quick Overview

JavaScript provides `try...catch` to handle runtime errors gracefully instead of crashing the program.

```javascript
try {
  riskyOperation();
} catch (error) {
  console.error('Something went wrong:', error.message);
} finally {
  cleanup(); // always runs
}
```

## Key Concepts

### try...catch...finally

- **try** — code that might throw an error
- **catch** — runs if try block throws
- **finally** — always runs (cleanup, logging, etc.)

### Throwing Errors

```javascript
throw new Error('Something went wrong');
throw new TypeError('Expected a string');
throw new RangeError('Value out of range');
```

### Built-in Error Types

| Type | When |
|------|------|
| `Error` | Generic error (base class) |
| `TypeError` | Wrong type (`undefined.property`) |
| `RangeError` | Value out of allowed range |
| `ReferenceError` | Undefined variable |
| `SyntaxError` | Invalid syntax |

### Custom Errors

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

throw new ValidationError('Required field missing', 'email');
```

### Error in Async Code

```javascript
// With promises
fetch(url)
  .then(res => res.json())
  .catch(error => console.error(error));

// With async/await
async function load() {
  try {
    const data = await fetch(url);
    return await data.json();
  } catch (error) {
    console.error(error);
  }
}
```

## Learn More

- [MDN: Error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#exception_handling_statements)
- [JavaScript.info: Error handling](https://javascript.info/try-catch)
- [MDN: Error types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [JavaScript.info: Custom errors](https://javascript.info/custom-errors)

## How to Work

1. **Study examples**: Run `node src/1-javascript/09-error-handling/examples/<file>.js`
2. **Complete exercises**: Open `exercises/error-handling.js` and write code

