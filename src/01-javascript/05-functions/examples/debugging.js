// ============================================
// DEBUGGING Examples
// ============================================
// Practical techniques for finding and fixing bugs
// Run with: node src/01-javascript/05-functions/examples/debugging.js

console.log('=== 1. console methods ===');

// console.log — general output
console.log('Simple log:', 42, 'hello', true, [1, 2, 3]);

// console.warn — yellow warning (non-fatal issue)
console.warn('⚠️  Deprecated function used');

// console.error — red error (but does NOT stop execution)
console.error('❌ Something went wrong (but code continues)');

// console.info — same as log, semantically different
console.info('ℹ️  Server started on port 3000');

console.log('\n=== 2. console.table — for arrays and objects ===');

const users = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
];

// Much cleaner than console.log for tabular data:
console.table(users);

// Show only specific columns:
console.table(users, ['name', 'role']);

console.log('\n=== 3. console.group — organize related logs ===');

function processOrder(order) {
  console.group(`Order #${order.id}`);  // Start group
  console.log('Customer:', order.customer);
  console.log('Total:', order.total);
  console.group('Items');               // Nested group
  order.items.forEach(item => console.log('-', item));
  console.groupEnd();                   // End 'Items' group
  console.log('Status: processing');
  console.groupEnd();                   // End 'Order' group
}

processOrder({
  id: 101,
  customer: 'Alice',
  total: 99.99,
  items: ['Book', 'Pen', 'Notebook']
});

console.log('\n=== 4. console.time — measure performance ===');

console.time('loop');
let sum = 0;
for (let i = 0; i < 1_000_000; i++) {
  sum += i;
}
console.timeEnd('loop');  // prints: loop: Xms

// Multiple named timers
console.time('parse');
JSON.parse('{"a":1,"b":2,"c":3}');
console.timeEnd('parse');

console.log('\n=== 5. console.assert — conditional logging ===');

// Only logs if condition is FALSE (like an assertion)
const age = 15;
console.assert(age >= 18, 'User must be 18+, got:', age); // Logs — condition is false
console.assert(age >= 0, 'Age cannot be negative');       // No log — condition is true

function divide(a, b) {
  console.assert(b !== 0, 'divide(): divisor cannot be 0');
  return a / b;
}

divide(10, 2);  // No assert log
divide(10, 0);  // Logs assertion error

console.log('\n=== 6. console.count — count how many times something runs ===');

function handleRequest(path) {
  console.count(`requests`);
  console.count(path);    // Count per path
}

handleRequest('/api/users');
handleRequest('/api/users');
handleRequest('/api/posts');
handleRequest('/api/users');

console.countReset('requests'); // Reset counter

console.log('\n=== 7. console.dir — inspect object structure ===');

// In Node.js, console.dir shows the object with depth
const deeply = { a: { b: { c: { d: 'deep' } } } };
console.dir(deeply, { depth: null }); // null = unlimited depth

console.log('\n=== 8. debugger statement ===');

// The 'debugger' keyword pauses execution in developer tools.
// When running in Node.js with --inspect flag or in browser DevTools:
//   - Sets a breakpoint at this line
//   - You can inspect all variables in scope
//   - Step through code line by line

function calculateDiscount(price, discountPercent) {
  // debugger; // ← Uncomment this when debugging in DevTools or node --inspect

  const discount = price * (discountPercent / 100);
  const finalPrice = price - discount;

  return finalPrice;
}

console.log('Price after 20% off:', calculateDiscount(100, 20));

// How to use debugger in Node.js:
// 1. Add 'debugger;' statement in your code
// 2. Run: node --inspect-brk your-file.js
// 3. Open Chrome → chrome://inspect → click "inspect"
// 4. DevTools opens, paused at first line
// 5. Click "Resume" to run until the debugger statement

console.log('\n=== 9. Reading Error Messages and Stack Traces ===');

// An error message tells you WHAT went wrong.
// A stack trace tells you WHERE and HOW you got there.

function a() { b(); }
function b() { c(); }
function c() {
  // Uncomment to see the full stack trace:
  // throw new Error('Something went wrong!');
  return 'ok';
}

try {
  a();
} catch (err) {
  // Real stack trace would show:
  // Error: Something went wrong!
  //   at c (debugging.js:100)   ← where the error was thrown
  //   at b (debugging.js:98)    ← who called c
  //   at a (debugging.js:97)    ← who called b
  //   at Object.<anonymous> ...  ← who called a
  console.log('(no error in this run, trace shown as comment above)');
}

// How to read stack traces:
// Line 1:  Error type + message
// Line 2+: Call stack (top = where error happened, bottom = entry point)
// Read from TOP to BOTTOM: the error happened at the TOP line

console.log('\n=== 10. Common Debugging Techniques ===');

// Technique 1: Log inputs and outputs at function boundaries
function processData(data) {
  console.log('processData INPUT:', data);
  const result = data.map(x => x * 2);
  console.log('processData OUTPUT:', result);
  return result;
}
processData([1, 2, 3]);

// Technique 2: Add labels to make logs easier to find
const firstName = 'Alice';
const lastName = 'Smith';
console.log({ firstName, lastName }); // ✅ Shows variable names + values
// vs: console.log(firstName, lastName); // ❌ Just shows values, hard to match

// Technique 3: Inspect 'this' context
function checkContext() {
  console.log('this is:', this === globalThis ? 'global' : 'custom object', this?.constructor?.name);
}
checkContext();

// Technique 4: Log inside loops to catch the iteration
const items = ['a', 'b', 'c'];
items.forEach((item, i) => {
  // Uncomment when debugging:
  // console.log(`Iteration ${i}:`, item);
});

// Technique 5: JSON.stringify for deep objects (vs shallow console.log)
const nested = { a: { b: { c: 42 } } };
console.log('Object:', nested);
console.log('JSON:', JSON.stringify(nested, null, 2));

console.log('\n=== 11. Node.js specific: --inspect ===');
console.log(`
To debug in Chrome DevTools:
  node --inspect-brk src/your-file.js

Then open:
  chrome://inspect
  → click "inspect" under your Node.js target

Useful node debug flags:
  --inspect           start debug server (don't pause)
  --inspect-brk       start debug server AND pause at first line
  --inspect=9229      use specific port (default: 9229)
`);

console.log('=== Best Practices ===');
console.log('1. Remove console.log statements before committing code');
console.log('2. Use console.table() for arrays of objects — much more readable');
console.log('3. Use { variable } shorthand to log with labels');
console.log('4. Read the full error message before guessing — it usually tells you what happened');
console.log('5. Read stack traces bottom-up to understand the call path');
console.log('6. Use console.time() to find performance bottlenecks');
console.log('7. The debugger statement + node --inspect is more powerful than console.log');
