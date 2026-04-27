// ============================================
// COMMONJS (CJS) MODULE SYSTEM Examples
// ============================================
// Run this file with: node src/04-backend/lessons/01-nodejs-and-npm/examples/modules-cjs.js

console.log('=== 1. Exporting and importing ===');

// In CJS, every file is a module with its own scope.
// You export values using module.exports or exports.

// --- Inline module simulation (normally these would be separate files) ---

// Simulating a math module
const mathModule = (() => {
  const exports = {};
  exports.add = (a, b) => a + b;
  exports.subtract = (a, b) => a - b;
  exports.multiply = (a, b) => a * b;
  return exports;
})();

console.log('add(2, 3):', mathModule.add(2, 3));
console.log('subtract(5, 3):', mathModule.subtract(5, 3));


console.log('\n=== 2. Using built-in modules ===');

// CJS require with Node built-in modules
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('Current file:', path.basename(__filename));  // modules-cjs.js
console.log('Current dir:', path.basename(__dirname));     // examples
console.log('Platform:', os.platform());                   // darwin, linux, win32
console.log('Home dir:', os.homedir());
console.log('CPUs:', os.cpus().length);


console.log('\n=== 3. __dirname and __filename ===');

// These globals are available in CJS but NOT in ESM
console.log('__filename:', __filename);  // full path to this file
console.log('__dirname:', __dirname);    // full path to directory


console.log('\n=== 4. require is synchronous ===');

// require() blocks execution until the module is fully loaded.
// This is fine at startup but NOT inside hot request paths.
console.log('Before require');
const loaded = require('path');  // synchronous, blocks until loaded
console.log('After require -- path.sep:', loaded.sep);


console.log('\n=== 5. require caches modules ===');

// Once a module is required, Node caches it.
// Subsequent require() calls return the SAME object.
const path1 = require('path');
const path2 = require('path');
console.log('Same object?', path1 === path2);  // true

// You can see the cache:
console.log('Cached modules count:', Object.keys(require.cache).length);


console.log('\n=== 6. module.exports vs exports ===');

// exports is a shorthand reference to module.exports
// exports.foo = 'bar'   ← works (adds property)
// exports = { foo: 'bar' }  ← DOES NOT WORK (reassigns the reference)
// module.exports = { foo: 'bar' }  ← works (replaces the whole export)

// Best practice: always use module.exports for clarity
