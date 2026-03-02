# JSON & Modules in JavaScript

## Quick Overview

Two essential skills for real-world JavaScript:
- **JSON** — the standard data format for APIs and configuration files
- **Modules** — how to split code into files and reuse it

---

## JSON

**JSON (JavaScript Object Notation)** is a text format for storing and exchanging data.

```js
// Object → JSON string
const user = { name: 'Alice', age: 30 };
const json = JSON.stringify(user);
// '{"name":"Alice","age":30}'

// JSON string → Object
const parsed = JSON.parse(json);
// { name: 'Alice', age: 30 }
```

### Key Rules
- Keys must be **double-quoted** strings
- Values can be: string, number, boolean, null, array, object
- No functions, undefined, or Symbol allowed
- `JSON.stringify()` removes functions and `undefined` values silently

### Options
```js
// Pretty-print with 2-space indentation
JSON.stringify(data, null, 2);

// Replacer: filter which keys to include
JSON.stringify(data, ['name', 'age']);

// Reviver: transform values during parse
JSON.parse(json, (key, value) => {
  if (key === 'date') return new Date(value);
  return value;
});
```

---

## Modules (ESM — ECMAScript Modules)

Modern JavaScript uses `import`/`export` to share code between files.

### Named Exports
```js
// math.js
export function add(a, b) { return a + b; }
export const PI = 3.14159;

// main.js
import { add, PI } from './math.js';
```

### Default Export
```js
// user.js
export default class User { ... }

// main.js
import User from './user.js';  // any name works
```

### Re-exports
```js
// index.js — barrel file
export { add, PI } from './math.js';
export { default as User } from './user.js';
```

---

## CommonJS (Node.js legacy)

Older Node.js code uses `require`/`module.exports`:

```js
// math.js (CommonJS)
module.exports = { add, PI };
exports.subtract = (a, b) => a - b; // alternative

// main.js
const { add, PI } = require('./math.js');
```

### ESM vs CommonJS
| Feature | ESM (`import`) | CommonJS (`require`) |
|---------|---------------|----------------------|
| Syntax | `import/export` | `require/module.exports` |
| Loading | Static (at parse time) | Dynamic (at runtime) |
| Tree shaking | ✅ Yes | ❌ No |
| Top-level await | ✅ Yes | ❌ No |
| Node.js file ext | `.mjs` or `"type":"module"` | `.cjs` or `.js` |

---

## Learn More

- [MDN: JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- [MDN: import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [MDN: export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- [JavaScript.info: JSON](https://javascript.info/json)
- [JavaScript.info: Modules](https://javascript.info/modules-intro)
- [Node.js: CommonJS vs ESM](https://nodejs.org/api/esm.html)

## How to Work

1. **Study examples**: Run `node examples/json-basics.js`
2. **Complete exercises**: Open `exercises/json-modules.js` and write code

