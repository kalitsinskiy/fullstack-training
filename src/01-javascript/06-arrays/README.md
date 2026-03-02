# Arrays in JavaScript

## Quick Overview

Arrays store ordered collections of values. JavaScript provides powerful built-in methods for working with arrays.

**Common operations:**
- **Create**: `[1, 2, 3]` or `new Array()`
- **Access**: `arr[0]` (first element)
- **Modify**: `arr.push(4)` (add to end)
- **Transform**: `arr.map(x => x * 2)` (create new array)

## Key Concepts

### Array Methods

**Mutating methods** (change original array):
- `push()`, `pop()`, `shift()`, `unshift()`
- `splice()`, `sort()`, `reverse()`

**Non-mutating methods** (return new array/value):
- `map()`, `filter()`, `reduce()`
- `slice()`, `concat()`, `join()`

### Essential Array Methods

```javascript
// Transform each element
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]

// Keep elements that pass test
[1, 2, 3, 4].filter(x => x > 2)  // [3, 4]

// Combine all elements into single value
[1, 2, 3].reduce((sum, x) => sum + x, 0)  // 6
```

### Iteration Methods

```javascript
// Execute function for each element (no return value)
arr.forEach(item => console.log(item))

// Find first matching element
arr.find(item => item > 10)

// Check if ANY element passes test
arr.some(item => item > 10)  // true/false

// Check if ALL elements pass test
arr.every(item => item > 0)  // true/false
```

### Array Destructuring

```javascript
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first = 1, second = 2, rest = [3, 4, 5]
```

### Spread Operator

```javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]
```

## When to Use Each Method

- **map**: Transform each element
- **filter**: Keep only certain elements
- **reduce**: Calculate single value from array
- **forEach**: Side effects (logging, API calls)
- **find**: Get first matching element
- **some/every**: Check conditions

## Learn More

- [MDN: Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#instance_methods)
- [JavaScript.info: Arrays](https://javascript.info/array)
- [JavaScript.info: Array methods](https://javascript.info/array-methods)

## How to Work

1. **Study examples**: Run `node src/01-javascript/06-arrays/examples/<file>.js`
2. **Complete exercises**: Open `exercises/arrays.js` and write code

