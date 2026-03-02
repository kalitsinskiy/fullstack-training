// ============================================
// ESM Modules — Concepts & Patterns
// ============================================
// NOTE: This file demonstrates module SYNTAX.
// To actually use import/export, files need:
//   - package.json with "type": "module", OR
//   - .mjs file extension
//
// Run this file to see the explanations:
// node src/01-javascript/12-json-modules/examples/modules-esm.js

console.log('=== ESM Module System Overview ===\n');

// ============================================
// EXPORT SYNTAX (shown as comments — cannot execute here)
// ============================================

console.log('--- 1. Named Exports ---');
console.log(`
// math.js
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export const PI = 3.14159;

// OR export at end of file:
function multiply(a, b) { return a * b; }
const E = 2.71828;
export { multiply, E };
`);

console.log('--- 2. Default Export ---');
console.log(`
// user.js — only ONE default export per file
export default class User {
  constructor(name) { this.name = name; }
}

// OR function:
export default function formatDate(date) {
  return date.toISOString();
}

// OR plain value:
export default 42;
`);

console.log('--- 3. Named + Default combined ---');
console.log(`
// api.js
export default class ApiClient { ... }  // default

export const BASE_URL = 'https://jsonplaceholder.typicode.com';  // named
export function buildUrl(path) { ... }               // named
`);

// ============================================
// IMPORT SYNTAX
// ============================================

console.log('\n--- 4. Import Named Exports ---');
console.log(`
import { add, subtract, PI } from './math.js';
import { add as sum } from './math.js';  // rename with 'as'
import * as Math from './math.js';       // import all as namespace

console.log(add(2, 3));    // 5
console.log(Math.PI);      // 3.14159
`);

console.log('--- 5. Import Default Export ---');
console.log(`
import User from './user.js';          // any name works for default
import MyUser from './user.js';        // same thing, different name
import formatDate from './api.js';     // the default export
`);

console.log('--- 6. Import Default + Named together ---');
console.log(`
import ApiClient, { BASE_URL, buildUrl } from './api.js';
//     ^ default         ^ named exports
`);

console.log('--- 7. Dynamic import() ---');
console.log(`
// Load module on demand (returns a Promise)
async function loadFeature() {
  const module = await import('./heavy-feature.js');
  module.default();    // use default export
  module.helper();     // use named export
}

// Conditional loading:
if (userWantsMap) {
  const { MapComponent } = await import('./MapComponent.js');
}
`);

// ============================================
// BARREL FILES / RE-EXPORTS
// ============================================

console.log('\n--- 8. Barrel Files (index.js pattern) ---');
console.log(`
// components/Button.js
export default function Button() { ... }

// components/Input.js
export default function Input() { ... }

// components/index.js — barrel file
export { default as Button } from './Button.js';
export { default as Input } from './Input.js';
export { helper } from './utils.js';

// Now consumers can import from one place:
import { Button, Input } from './components';
// instead of:
import Button from './components/Button.js';
import Input from './components/Input.js';
`);

// ============================================
// ESM IN NODE.JS
// ============================================

console.log('\n--- 9. Enabling ESM in Node.js ---');
console.log(`
// Option 1: Add to package.json
{
  "type": "module"   // all .js files become ESM
}

// Option 2: Use .mjs extension
// rename file to math.mjs and use .mjs imports

// Note: __dirname and __filename not available in ESM!
// Use instead:
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`);

// ============================================
// PRACTICAL WORKING EXAMPLE (without real modules)
// ============================================

console.log('\n=== Practical Example: Module pattern simulation ===\n');

// Simulate what a module would export
const mathModule = (() => {
  const PI = 3.14159;

  function add(a, b) { return a + b; }
  function multiply(a, b) { return a * b; }
  function circleArea(r) { return PI * r * r; }

  // "Default export" — the main thing
  function calculate(op, ...args) {
    const ops = { add, multiply };
    return ops[op]?.(...args) ?? 'Unknown operation';
  }

  // "Named exports"
  return { default: calculate, add, multiply, circleArea, PI };
})();

// Simulating: import calculate, { add, circleArea } from './math.js'
const { default: calculate, add, circleArea } = mathModule;

console.log('add(2, 3):', add(2, 3));
console.log('circleArea(5):', circleArea(5).toFixed(2));
console.log('calculate("multiply", 4, 5):', calculate('multiply', 4, 5));

console.log('\n=== Key Differences: ESM vs CommonJS ===\n');

const comparison = [
  ['Feature', 'ESM (import/export)', 'CommonJS (require)'],
  ['Syntax', 'import/export', 'require/module.exports'],
  ['Loading', 'Static (parse time)', 'Dynamic (runtime)'],
  ['Top-level await', '✅ Yes', '❌ No'],
  ['Tree shaking', '✅ Supported', '❌ Not supported'],
  ['Node.js default', '❌ (need "type":"module")', '✅ Default'],
  ['Browser native', '✅ Yes', '❌ No'],
  ['Circular imports', 'Live bindings', 'Cached exports'],
];

comparison.forEach(([feature, esm, cjs]) => {
  console.log(`${feature.padEnd(20)} | ${esm.padEnd(25)} | ${cjs}`);
});

console.log('\n=== Best Practices ===');
console.log('1. Prefer ESM (import/export) for new projects');
console.log('2. Use named exports for utilities — easier to tree-shake');
console.log('3. Use default export for the main thing a module provides');
console.log('4. Create barrel files (index.js) for cleaner imports');
console.log('5. Use dynamic import() for code splitting and lazy loading');
console.log('6. Avoid circular imports — they cause subtle bugs');
console.log('7. Keep modules focused — one responsibility per module');
