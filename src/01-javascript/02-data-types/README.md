# Data Types in JavaScript

## Quick Overview

JavaScript has **8 data types**:

**Primitive types** (7):

- **String** - text values (`"hello"`, `'world'`)
- **Number** - integers and decimals (`42`, `3.14`)
- **BigInt** - very large integers (`9007199254740991n`)
- **Boolean** - true or false
- **Undefined** - variable declared but not assigned
- **Null** - intentional absence of value
- **Symbol** - unique identifiers (advanced)

**Reference type** (1):

- **Object** - collections of data (includes arrays, functions,

## Key Concepts

### Primitive vs Reference

**Primitives** are immutable and compared by value:

```javascript
let a = 5;
let b = 5;
console.log(a === b); // true
```

**Objects** are mutable and compared by reference:

```javascript
let obj1 = { x: 5 };
let obj2 = { x: 5 };
console.log(obj1 === obj2); // false (different references)
```

### Type Conversion

JavaScript can **automatically convert** types (type coercion):

```javascript
'5' + 3; // "53" (number to string)
'5' - 3; // 2 (string to number)
```

### Truthy and Falsy

**Falsy values** (only 6):

- `false`, `0`, `""`, `null`, `undefined`, `NaN`

Everything else is **truthy** (including `"0"`, `[]`, `{}`)

### Checking Types

Use `typeof` operator:

```javascript
typeof 'hello'; // "string"
typeof 42; // "number"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" ⚠️ (historical bug)
typeof []; // "object"
```

## Learn More

- [MDN: JavaScript data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures)
- [MDN: Type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion)
- [JavaScript.info: Data types](https://javascript.info/types)
- [MDN: typeof operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
- [MDN: Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)

## How to Work

1. **Study examples**: Run `node src/01-javascript/02-data-types/examples/<file>.js`
2. **Complete exercises**: Open `exercises/data-types.js` and write code
