// ============================================
// CommonJS vs ESM — Side by Side
// ============================================
// CommonJS is the original Node.js module system.
// This file shows how CommonJS works and how it
// compares to modern ESM.
//
// Run with: node src/01-javascript/12-json-modules/examples/commonjs.js

console.log('=== 1. CommonJS: require / module.exports ===\n');

// In CommonJS, you export via module.exports
// In ESM, you'd use: export function add(a, b) { ... }

// Simulated "math module" (what math.js would look like)
const mathModule = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  PI: 3.14159
};

// CommonJS style: module.exports = { add, subtract, PI }
// ESM style:      export { add, subtract, PI }  OR  export default { ... }

// CommonJS require (simulated)
const { add, subtract, PI } = mathModule; // like: const { add } = require('./math')

console.log('add(5, 3):', add(5, 3));
console.log('subtract(10, 4):', subtract(10, 4));
console.log('PI:', PI);

console.log('\n=== 2. CommonJS syntax overview ===\n');

console.log(`
// ---- math.js (CommonJS) ----

// Named exports via exports object:
exports.add = (a, b) => a + b;
exports.PI = 3.14159;

// OR replace entire exports:
module.exports = {
  add: (a, b) => a + b,
  PI: 3.14159
};

// Default-like export (single value):
module.exports = function greet(name) {
  return \`Hello, \${name}!\`;
};


// ---- main.js (CommonJS) ----

// Import everything:
const math = require('./math');
console.log(math.add(2, 3));

// Destructured import:
const { add, PI } = require('./math');

// Rename on import:
const { add: sum } = require('./math');
`);

console.log('=== 3. ESM syntax overview ===\n');

console.log(`
// ---- math.mjs (ESM) ----

export function add(a, b) { return a + b; }
export const PI = 3.14159;
export default function multiply(a, b) { return a * b; }


// ---- main.mjs (ESM) ----

import multiply, { add, PI } from './math.mjs';
import * as Math from './math.mjs';  // namespace import
`);

console.log('=== 4. Side-by-side comparison ===\n');

const differences = [
  {
    aspect: 'Basic export',
    commonjs: "module.exports = { add, PI }",
    esm: "export { add, PI }",
  },
  {
    aspect: 'Single export',
    commonjs: "module.exports = function() {}",
    esm: "export default function() {}",
  },
  {
    aspect: 'Named export inline',
    commonjs: "exports.add = (a, b) => a + b",
    esm: "export const add = (a, b) => a + b",
  },
  {
    aspect: 'Basic import',
    commonjs: "const math = require('./math')",
    esm: "import math from './math.js'",
  },
  {
    aspect: 'Destructured import',
    commonjs: "const { add } = require('./math')",
    esm: "import { add } from './math.js'",
  },
  {
    aspect: 'Dynamic import',
    commonjs: "const mod = require('./mod')",
    esm: "const mod = await import('./mod.js')",
  },
  {
    aspect: 'Current file path',
    commonjs: "__filename, __dirname",
    esm: "import.meta.url, import.meta.dirname",
  },
];

differences.forEach(({ aspect, commonjs, esm }) => {
  console.log(`${aspect}:`);
  console.log(`  CJS: ${commonjs}`);
  console.log(`  ESM: ${esm}`);
  console.log();
});

console.log('=== 5. When CommonJS is still relevant ===\n');

console.log('CommonJS is still widely used because:');
console.log('- Most npm packages (pre-2020) use CommonJS');
console.log('- Node.js uses CommonJS by default (.js files)');
console.log('- Configuration files (jest.config.js, .eslintrc.js) often use CJS');
console.log('- Many tools have not fully migrated to ESM\n');

console.log('You will encounter CommonJS when:');
console.log('- Working in older Node.js codebases');
console.log('- Reading npm package source code');
console.log('- Writing Jest config (jest.config.js)');
console.log('- Using require() in Node.js scripts\n');

console.log('=== 6. package.json: controlling module type ===\n');

console.log(`
{
  "type": "module"    // All .js files are ESM
}
// OR
{
  "type": "commonjs"  // All .js files are CJS (default)
}

// Override per-file with extensions:
// .mjs  → always ESM
// .cjs  → always CommonJS
`);

console.log('=== 7. Interoperability ===\n');

console.log(`
// Importing CJS from ESM — works fine:
import _ from 'lodash';  // lodash is CJS

// Importing ESM from CJS — does NOT work directly:
// const { something } = require('./esm-module.mjs'); // Error!

// Use dynamic import() workaround:
async function loadEsm() {
  const { something } = await import('./esm-module.mjs');
}
`);

console.log('=== 8. Real-world module in Node.js (CommonJS style) ===\n');

// Simulate what a utility module looks like in CommonJS
function createLogger(prefix) {
  return {
    log: (msg) => console.log(`[${prefix}] ${msg}`),
    error: (msg) => console.error(`[${prefix}] ERROR: ${msg}`),
    warn: (msg) => console.warn(`[${prefix}] WARN: ${msg}`),
  };
}

// As CJS: module.exports = { createLogger }
// As ESM: export { createLogger }

const logger = createLogger('App');
logger.log('Application started');
logger.warn('This is a warning');

console.log('\n=== Best Practices ===');
console.log('1. Use ESM (import/export) for new Node.js projects');
console.log('2. Add "type": "module" to package.json for ESM');
console.log('3. Use .cjs extension for files that must stay CommonJS');
console.log('4. Use .mjs extension when mixing CJS and ESM projects');
console.log('5. Know CommonJS for reading existing Node.js code and configs');
console.log('6. Avoid mixing systems in the same project when possible');
