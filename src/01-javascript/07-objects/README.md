# Objects in JavaScript

## Quick Overview

Objects store collections of key-value pairs (properties). They are fundamental to JavaScript - everything except primitives is an object.

**Basic syntax:**
```javascript
const person = {
  name: 'Alice',
  age: 25,
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};
```

## Key Concepts

### Object Literals

```javascript
// Create object
const user = {
  name: 'Alice',
  age: 25
};

// Access properties
user.name        // Dot notation
user['age']      // Bracket notation
```

### Object Methods

```javascript
// Method shorthand
const obj = {
  greet() {
    return 'Hello';
  }
};

// this keyword
const person = {
  name: 'Alice',
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
};
```

### Object Destructuring

```javascript
const user = { name: 'Alice', age: 25, city: 'London' };

// Extract properties
const { name, age } = user;
console.log(name, age); // 'Alice' 25

// Rename properties
const { name: userName } = user;

// Default values
const { country = 'USA' } = user;
```

### Spread Operator

```javascript
const original = { a: 1, b: 2 };

// Copy object
const copy = { ...original };

// Merge objects
const merged = { ...original, c: 3 };

// Override properties
const updated = { ...original, a: 99 };
```

### Object Iteration

```javascript
const obj = { a: 1, b: 2, c: 3 };

// Get keys
Object.keys(obj)     // ['a', 'b', 'c']

// Get values
Object.values(obj)   // [1, 2, 3]

// Get entries (key-value pairs)
Object.entries(obj)  // [['a', 1], ['b', 2], ['c', 3]]
```

## Important Methods

- `Object.keys(obj)` - array of keys
- `Object.values(obj)` - array of values
- `Object.entries(obj)` - array of [key, value] pairs
- `Object.assign(target, source)` - merge objects
- `Object.freeze(obj)` - make immutable
- `Object.seal(obj)` - prevent adding/removing properties

## Learn More

- [MDN: Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [MDN: Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects)
- [JavaScript.info: Objects](https://javascript.info/object)
- [MDN: Object destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring)

## How to Work

1. **Study examples**: Run `node src/1-javascript/05-objects/examples/<file>.js`
2. **Complete exercises**: Open `exercises/objects.js` and write code

