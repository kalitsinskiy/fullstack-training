# Strings in JavaScript

## Quick Overview

Strings are immutable sequences of characters. JavaScript has many built-in methods for working with strings.

```javascript
const str = 'Hello, World!';
str.length        // 13
str[0]            // 'H'
str.toUpperCase() // 'HELLO, WORLD!'
```

## Key Concepts

### String Creation

```javascript
'Single quotes'
"Double quotes"
`Template literal ${variable}`  // Can embed expressions
```

### Common String Methods

**Searching:**
```javascript
str.includes('World')   // true
str.indexOf('o')        // 4 (first occurrence)
str.startsWith('Hello') // true
str.endsWith('!')       // true
```

**Extracting:**
```javascript
str.slice(0, 5)     // 'Hello'
str.slice(-6)       // 'orld!'  (from end)
str.substring(7, 12) // 'World'
str.at(-1)          // '!'     (last char)
```

**Transforming:**
```javascript
str.toUpperCase()   // 'HELLO, WORLD!'
str.toLowerCase()   // 'hello, world!'
str.trim()          // removes leading/trailing spaces
str.replace('World', 'JS') // 'Hello, JS!'
str.split(', ')     // ['Hello', 'World!']
```

**Padding:**
```javascript
'5'.padStart(3, '0')  // '005'
'5'.padEnd(3, '0')    // '500'
```

### Template Literals

```javascript
const name = 'Alice';
const age = 25;

const message = `Hello, ${name}! You are ${age} years old.`;
// Multi-line
const html = `
  <div>
    <p>${name}</p>
  </div>
`;
```

### Strings are Immutable

```javascript
let str = 'hello';
str[0] = 'H'; // Does nothing!
str = 'Hello'; // Create new string instead
```

## Learn More

- [MDN: String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [JavaScript.info: Strings](https://javascript.info/string)
- [MDN: Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

## How to Work

1. **Study examples**: Run `node src/1-javascript/08-strings/examples/<file>.js`
2. **Complete exercises**: Open `exercises/strings.js` and write code

