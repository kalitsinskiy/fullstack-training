// ============================================
// ES MODULES (ESM) Examples
// ============================================
// Run this file with: node src/04-backend/lessons/01-nodejs-and-npm/examples/modules-esm.mjs

console.log('=== 1. Importing built-in modules ===');

// ESM uses the 'import' keyword (static, at the top)
import path from 'node:path';
import { platform, cpus, homedir } from 'node:os';
import { readFileSync } from 'node:fs';

console.log('Platform:', platform());
console.log('CPUs:', cpus().length);
console.log('Home:', homedir());


console.log('\n=== 2. No __dirname or __filename in ESM ===');

// ESM does not have __dirname or __filename.
// Use import.meta.url instead:
console.log('import.meta.url:', import.meta.url);

// To get __dirname equivalent:
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('__filename (derived):', __filename);
console.log('__dirname (derived):', __dirname);


console.log('\n=== 3. Named vs default exports ===');

// Named exports (multiple per module):
// export const add = (a, b) => a + b;
// export const subtract = (a, b) => a - b;
// import { add, subtract } from './math.mjs';

// Default export (one per module):
// export default class Logger { ... }
// import Logger from './logger.mjs';

// Re-export:
// export { add } from './math.mjs';

console.log('Named: import { x } from ...');
console.log('Default: import X from ...');
console.log('Namespace: import * as X from ...');


console.log('\n=== 4. Dynamic import (lazy loading) ===');

// ESM supports dynamic import() which returns a Promise
// Useful for conditional loading or code splitting
async function loadModule() {
  const os = await import('node:os');
  console.log('Dynamically loaded — hostname:', os.hostname());
}

await loadModule();  // top-level await works in ESM!


console.log('\n=== 5. Top-level await ===');

// ESM supports top-level await (CJS does not)
const start = Date.now();
await new Promise((resolve) => setTimeout(resolve, 50));
console.log(`Top-level await: waited ${Date.now() - start}ms`);


console.log('\n=== 6. JSON imports ===');

// In ESM, you can import JSON with an import assertion (Node 20+):
// import pkg from './package.json' with { type: 'json' };
// console.log(pkg.name);

// Or use createRequire as a workaround:
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// const pkg = require('./package.json');

console.log('JSON import: use "with { type: \'json\' }" or createRequire workaround');

console.log('\nESM examples complete!');
