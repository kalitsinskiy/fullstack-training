// ============================================
// EVENT LOOP Examples
// ============================================
// Run this file with: node src/04-backend/lessons/01-nodejs-and-npm/examples/event-loop.js

console.log('=== 1. Execution order ===');

console.log('1: synchronous - start');

setTimeout(() => console.log('2: setTimeout (timers phase)'), 0);

setImmediate(() => console.log('3: setImmediate (check phase)'));

process.nextTick(() => console.log('4: process.nextTick (microtask - runs first)'));

Promise.resolve().then(() => console.log('5: Promise.then (microtask - after nextTick)'));

console.log('6: synchronous - end');

// Expected output:
// 1: synchronous - start
// 6: synchronous - end
// 4: process.nextTick (microtask - runs first)
// 5: Promise.then (microtask - after nextTick)
// 2: setTimeout (timers phase)        ← order of 2 and 3 is non-deterministic
// 3: setImmediate (check phase)       ← in the main module


console.log('\n=== 2. nextTick vs Promise ===');

// process.nextTick always runs before Promise callbacks
process.nextTick(() => console.log('nextTick 1'));
Promise.resolve().then(() => console.log('promise 1'));
process.nextTick(() => console.log('nextTick 2'));
Promise.resolve().then(() => console.log('promise 2'));

// Output:
// nextTick 1
// nextTick 2
// promise 1
// promise 2


console.log('\n=== 3. setTimeout vs setImmediate inside I/O ===');

const fs = require('fs');

// Inside an I/O callback, setImmediate ALWAYS fires before setTimeout
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout inside I/O'), 0);
  setImmediate(() => console.log('immediate inside I/O (always first in I/O context)'));
});

// Output (always deterministic inside I/O):
// immediate inside I/O (always first in I/O context)
// timeout inside I/O


console.log('\n=== 4. Nested nextTick (starvation warning) ===');

// WARNING: recursive nextTick can starve the event loop
let count = 0;
function recursiveNextTick() {
  if (count < 3) {
    count++;
    console.log(`nextTick call #${count}`);
    process.nextTick(recursiveNextTick);
  } else {
    console.log('Done with recursive nextTick. Event loop can continue.');
  }
}
process.nextTick(recursiveNextTick);

// If you never stop, setTimeout/setImmediate callbacks will NEVER run.
// This is called "starvation" -- avoid it in production.


console.log('\n=== 5. Timers are not precise ===');

const start = Date.now();
setTimeout(() => {
  const elapsed = Date.now() - start;
  console.log(`setTimeout(100) actually fired after ${elapsed}ms`);
  // Usually slightly more than 100ms -- timers are a minimum delay, not exact
}, 100);
