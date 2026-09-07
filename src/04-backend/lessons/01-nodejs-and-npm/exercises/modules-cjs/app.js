// ============================================
// CJS MODULE Exercise — Part 2: Use the module
// ============================================
// Run: node src/04-backend/lessons/01-nodejs-and-npm/exercises/modules-cjs/app.js

// TODO: Import all functions from ./math.js using require()
// Then run the assertions below — they should all pass.

// Your code here:

// --- Tests (do not modify) ---
const assert = require('assert');
const { add, subtract, multiply, divide } = require('./math');

assert.strictEqual(add(2, 3), 5, 'add(2,3) should be 5');
assert.strictEqual(subtract(10, 4), 6, 'subtract(10,4) should be 6');
assert.strictEqual(multiply(3, 7), 21, 'multiply(3,7) should be 21');
assert.strictEqual(divide(10, 2), 5, 'divide(10,2) should be 5');

try {
  divide(1, 0);
  assert.fail('divide(1,0) should throw');
} catch (err) {
  assert.strictEqual(err.message, 'Division by zero');
}

// Verify that require caches the module (same object reference)
const math1 = require('./math');
const math2 = require('./math');
assert.strictEqual(math1, math2, 'require should return cached module');

console.log('All CJS tests passed!');
