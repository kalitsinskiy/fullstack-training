// ============================================
// EVENT LOOP Examples
// ============================================
// Understanding HOW JavaScript executes code
// Run with: node src/01-javascript/11-async/examples/event-loop.js

console.log('=== 1. JavaScript is single-threaded ===\n');

// JavaScript executes ONE thing at a time — there is only ONE thread.
// But it can handle async operations (timers, network, file I/O) without blocking.
// This works thanks to the EVENT LOOP.

// Key components:
// 1. Call Stack   — where synchronous code runs (LIFO: last in, first out)
// 2. Web APIs     — browser/Node.js handles async operations here (timers, fetch, etc.)
// 3. Callback Queue (Macrotask Queue) — setTimeout, setInterval callbacks wait here
// 4. Microtask Queue  — Promise .then(), queueMicrotask() wait here
// 5. Event Loop   — constantly checks: if call stack is empty, push next task

console.log('=== 2. Call Stack — synchronous execution ===\n');

function multiply(a, b) { return a * b; }
function square(n) { return multiply(n, n); }
function printSquare(n) {
  const result = square(n);
  console.log('Square:', result);
}

// Call stack at printSquare(4):
// 4. multiply(4, 4)   ← executing
// 3. square(4)        ← called multiply
// 2. printSquare(4)   ← called square
// 1. (anonymous)      ← called printSquare
// When multiply returns → popped. Then square → popped. Etc.

printSquare(4); // 16

console.log('\n=== 3. Basic order: sync vs setTimeout ===\n');

// What order will these print?
console.log('1. Script start');

setTimeout(() => console.log('4. setTimeout (0ms)'), 0);

console.log('2. Script end (sync)');

// Even with 0ms, setTimeout goes to callback queue
// and only runs AFTER the synchronous code finishes.

// Output order:
// 1. Script start
// 2. Script end (sync)     ← sync code finishes first
// 4. setTimeout (0ms)      ← then the callback queue is processed

// Wait a moment before next section
setTimeout(() => {
  console.log('\n=== 4. Macrotasks vs Microtasks ===\n');

  // Two different queues — MICROTASKS run BEFORE macrotasks
  //
  // MACROTASK queue (lower priority):
  //   setTimeout, setInterval, setImmediate (Node.js), I/O events
  //
  // MICROTASK queue (higher priority):
  //   Promise.then / catch / finally
  //   queueMicrotask()
  //   MutationObserver (browser)
  //
  // Rule: After every macrotask, ALL microtasks are drained before next macrotask

  console.log('A — sync');

  setTimeout(() => console.log('C — macrotask (setTimeout)'), 0);

  Promise.resolve().then(() => console.log('B — microtask (Promise.then)'));

  console.log('A2 — sync');

  // Output:
  // A — sync
  // A2 — sync            ← sync finishes
  // B — microtask        ← ALL microtasks run before macrotask
  // C — macrotask        ← macrotask runs last
}, 100);

setTimeout(() => {
  console.log('\n=== 5. Multiple microtasks drain before next macrotask ===\n');

  setTimeout(() => console.log('MACRO 1'), 0);
  setTimeout(() => console.log('MACRO 2'), 0);

  Promise.resolve()
    .then(() => console.log('MICRO 1'))
    .then(() => console.log('MICRO 2'))  // chained — runs after MICRO 1
    .then(() => console.log('MICRO 3'));

  Promise.resolve().then(() => console.log('MICRO 4'));

  // Output:
  // MICRO 1   ← all microtasks first
  // MICRO 4   ← (MICRO 2 and 3 are chained, so they queue after their predecessors)
  // MICRO 2
  // MICRO 3
  // MACRO 1   ← then macrotasks
  // MACRO 2
}, 300);

setTimeout(() => {
  console.log('\n=== 6. async/await is just Promise syntax sugar ===\n');

  // async/await doesn't create new scheduling rules.
  // await is equivalent to .then()
  // Everything after 'await' goes into microtask queue.

  async function fetchData() {
    console.log('fetchData: start');
    await Promise.resolve(); // yield to microtask queue
    console.log('fetchData: after await'); // this is a microtask
  }

  console.log('before fetchData');
  fetchData();
  console.log('after fetchData call'); // runs BEFORE "after await"

  // Output:
  // before fetchData
  // fetchData: start
  // after fetchData call   ← sync code continues
  // fetchData: after await ← then the microtask resumes
}, 600);

setTimeout(() => {
  console.log('\n=== 7. Full order example ===\n');

  console.log('--- START ---');

  setTimeout(() => console.log('setTimeout 1'), 0);

  Promise.resolve()
    .then(() => {
      console.log('Promise 1');
      setTimeout(() => console.log('setTimeout 2 (from promise)'), 0);
    })
    .then(() => console.log('Promise 2'));

  setTimeout(() => console.log('setTimeout 3'), 0);

  console.log('--- END of sync ---');

  // Expected output:
  // --- START ---
  // --- END of sync ---      ← sync done
  // Promise 1                ← microtask 1 (from first .then)
  // Promise 2                ← microtask 2 (chained .then)
  // setTimeout 1             ← macrotask queue (in order they were added)
  // setTimeout 3             ← macrotask queue
  // setTimeout 2 (from promise) ← added to macrotask queue later (from Promise 1)
}, 900);

setTimeout(() => {
  console.log('\n=== 8. Why this matters for real code ===\n');

  // Scenario: state update before render
  // In browsers, DOM updates happen as macrotasks.
  // Promise.then (microtask) runs BEFORE the next DOM paint.
  // This means: batching multiple state updates in Promises = one render.

  // Scenario: setTimeout(fn, 0) doesn't mean "immediately"
  // It means "after current synchronous code AND all microtasks"
  const results = [];

  setTimeout(() => results.push('timer'), 0);
  Promise.resolve().then(() => results.push('promise'));
  results.push('sync');

  setTimeout(() => {
    // At this point, all 3 have run
    console.log('Order was:', results); // ['sync', 'promise', 'timer']
  }, 50);

  // Scenario: Avoid long synchronous tasks
  // If a function takes 2 seconds to run synchronously,
  // NO timers, NO events, NO renders can happen during that time.
  // The UI freezes. This is why we use async/await or Web Workers.

  console.log('Key takeaway: Microtasks (Promises) always run before macrotasks (setTimeout)');
}, 1200);

setTimeout(() => {
  console.log('\n=== 9. Node.js specific: setImmediate and process.nextTick ===\n');

  // Node.js adds two more queues (not in browsers):
  //
  // process.nextTick()  — runs BEFORE even microtasks (highest priority!)
  // setImmediate()      — runs after I/O events (similar to setTimeout(0))

  process.nextTick(() => console.log('process.nextTick'));    // highest priority
  Promise.resolve().then(() => console.log('Promise.then'));  // microtask
  setImmediate(() => console.log('setImmediate'));            // after I/O
  setTimeout(() => console.log('setTimeout 0'), 0);          // macrotask

  // Output in Node.js:
  // process.nextTick   ← runs first, even before promises!
  // Promise.then       ← microtask
  // setTimeout 0       ← macrotask (setImmediate vs setTimeout order can vary)
  // setImmediate       ← after I/O

  console.log('(In browsers, process.nextTick and setImmediate do not exist)');
}, 1500);

setTimeout(() => {
  console.log('\n=== Summary: Event Loop in one picture ===\n');
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │                    CALL STACK                        │
  │   (synchronous code runs here, one frame at a time) │
  └────────────────────────┬────────────────────────────┘
                           │  empty?
                           ▼
  ┌─────────────────────────────────────────────────────┐
  │              MICROTASK QUEUE (high priority)         │
  │   Promise.then / .catch / .finally                   │
  │   await (everything after it)                        │
  │   queueMicrotask()                                   │
  │   process.nextTick() ← Node.js only, even higher    │
  └────────────────────────┬────────────────────────────┘
                           │  all drained?
                           ▼
  ┌─────────────────────────────────────────────────────┐
  │               MACROTASK QUEUE (lower priority)       │
  │   setTimeout / setInterval callbacks                 │
  │   setImmediate() ← Node.js only                     │
  │   I/O events, click events, etc.                    │
  └─────────────────────────────────────────────────────┘

  EVENT LOOP: [ run sync → drain microtasks → run 1 macrotask → drain microtasks → ... ]
  `);

  console.log('=== Best Practices ===');
  console.log('1. Avoid long synchronous operations — they block EVERYTHING');
  console.log('2. Microtasks (Promises) always run before macrotasks (setTimeout)');
  console.log('3. setTimeout(fn, 0) means "after sync code and microtasks" — not "immediately"');
  console.log('4. In Node.js: process.nextTick() runs before Promise.then()');
  console.log('5. Use async/await to keep code non-blocking');
  console.log('6. Understanding this helps debug subtle ordering bugs');
}, 1800);
