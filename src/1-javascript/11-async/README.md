# Asynchronous JavaScript

## Quick Overview

Asynchronous code allows JavaScript to perform long-running operations without blocking the main thread. Essential for APIs, file operations, timers, and more.

**Three approaches:**
1. **Callbacks** - functions passed to be called later
2. **Promises** - objects representing eventual completion/failure
3. **Async/Await** - syntactic sugar for promises (modern, preferred)

## Key Concepts

### Callbacks

```javascript
setTimeout(() => {
  console.log('After 1 second');
}, 1000);
```

**Problem**: Callback hell (nested callbacks)

### Promises

```javascript
fetch('https://jsonplaceholder.typicode.com/posts')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

**States**: pending → fulfilled or rejected

### Async/Await

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

**Benefits**: Looks like synchronous code, easier to read

### Error Handling

```javascript
// Promises
promise
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Async/await
try {
  const result = await promise;
} catch (error) {
  console.error(error);
}
```

### Parallel vs Sequential

```javascript
// Sequential (one after another)
const result1 = await fetch(url1);
const result2 = await fetch(url2);

// Parallel (at the same time)
const [result1, result2] = await Promise.all([
  fetch(url1),
  fetch(url2)
]);
```

## Important Methods

- `Promise.resolve(value)` - create resolved promise
- `Promise.reject(error)` - create rejected promise
- `Promise.all([promises])` - wait for all (fails if any fails)
- `Promise.race([promises])` - wait for first to complete
- `Promise.allSettled([promises])` - wait for all (never fails)

## Learn More

- [MDN: Asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- [MDN: Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await)
- [JavaScript.info: Async/await](https://javascript.info/async-await)

## How to Work

1. **Study examples**: Run `node src/1-javascript/07-async/examples/<file>.js`
2. **Complete exercises**: Open `exercises/async.js` and write code
3. **Prepare for evaluation**: Review `QUESTIONS.md`
