# Variables in JavaScript

## Quick Overview

JavaScript has three ways to declare variables:
- **const** - Cannot be reassigned (use by default)
- **let** - Can be reassigned (use when needed)
- **var** - Old way (avoid in modern code)

## Key Concepts

### Block Scope
Variables declared with `let` and `const` are block-scoped - they only exist within `{...}`.

```javascript
{
  let x = 1;
  const y = 2;
}
// x and y don't exist here
```

### Hoisting
JavaScript moves variable declarations to the top of their scope, but `let`/`const` are in "temporal dead zone" until declaration.

```javascript
console.log(a); // undefined (var is hoisted)
console.log(b); // ReferenceError (let is not accessible)

var a = 1;
let b = 2;
```

### When to Use

- **const** - Default choice. Use for values that won't be reassigned
- **let** - Use when you need to reassign the variable
- **var** - Don't use in modern JavaScript

## Learn More

**MDN Documentation:**
- [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [var](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)
- [Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)

**JavaScript.info:**
- [Variables](https://javascript.info/variables)
- [The old "var"](https://javascript.info/var)

**Video Tutorials:**
- [JavaScript Variables - let, const, var (YouTube)](https://www.youtube.com/results?search_query=javascript+variables+let+const+var)

## How to Work

1. **Study examples**: Run each file in `examples/` folder
   ```bash
   node examples/let-const.js
   node examples/var-hoisting.js
   node examples/scope.js
   ```

2. **Complete exercises**: Open `exercises/variables.js` and solve TODOs
