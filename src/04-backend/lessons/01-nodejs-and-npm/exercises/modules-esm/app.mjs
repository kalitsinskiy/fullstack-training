// ============================================
// ESM MODULE Exercise — Part 2: Use the module
// ============================================
// Run: node src/04-backend/lessons/01-nodejs-and-npm/exercises/modules-esm/app.mjs

// TODO: Import named exports (add, subtract) and the default export (Calculator)
// from ./math.mjs using ES Module syntax.
//
// Named:   import { add, subtract } from '...';
// Default: import Calculator from '...';

// Your code here:

// TODO: Use import.meta.url to derive __filename and __dirname equivalents.
// Hint: use fileURLToPath from 'node:url' and dirname from 'node:path'.

// --- Tests (do not modify) ---
import assert from 'node:assert';

assert.strictEqual(add(2, 3), 5, 'add(2,3) should be 5');
assert.strictEqual(subtract(10, 4), 6, 'subtract(10,4) should be 6');

const calc = new Calculator();
assert.strictEqual(calc.multiply(3, 7), 21, 'multiply(3,7) should be 21');
assert.strictEqual(calc.divide(10, 2), 5, 'divide(10,2) should be 5');

try {
  calc.divide(1, 0);
  assert.fail('divide(1,0) should throw');
} catch (err) {
  assert.strictEqual(err.message, 'Division by zero');
}

// Verify __filename and __dirname are defined
assert.ok(__filename.endsWith('app.mjs'), '__filename should end with app.mjs');
assert.ok(__dirname.length > 0, '__dirname should be a non-empty string');

console.log('All ESM tests passed!');
console.log('__filename:', __filename);
console.log('__dirname:', __dirname);
