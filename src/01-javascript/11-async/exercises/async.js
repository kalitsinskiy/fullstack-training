// ============================================
// ASYNC Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: node src/01-javascript/11-async/exercises/async.js

console.log('=== Exercise 1: setTimeout callback ===');
// TODO: Use setTimeout to log "Hello" after 1 second
// Your code here:


console.log('\n=== Exercise 2: Create a Promise ===');
// TODO: Create a promise that resolves with "Success!" after 1 second
// Your code here:


console.log('\n=== Exercise 3: Using .then() ===');
// TODO: Use .then() to log the result of the promise above
// Your code here:


console.log('\n=== Exercise 4: async/await ===');
// TODO: Rewrite Exercise 3 using async/await
async function demo() {
  // Your code here:
}
// demo();


console.log('\n=== Exercise 5: Error handling with try-catch ===');
// TODO: Create a promise that rejects, handle it with try-catch
async function handleError() {
  // Your code here:
}
// handleError();


console.log('\n=== Exercise 6: Promise.all() ===');
// TODO: Create 3 promises, wait for all using Promise.all()
async function waitForAll() {
  // Your code here:
}
// waitForAll();


console.log('\n=== Exercise 7: Sequential vs Parallel ===');
// TODO: Compare time difference between sequential and parallel execution
// Hint: Create delay function, measure time
// Your code here:


console.log('\n=== Exercise 8: fetch API (if available) ===');
// TODO: Fetch data from an API using async/await
// Handle both success and error cases
async function fetchData() {
  // Your code here:
  // Example: await fetch('https://jsonplaceholder.typicode.com/posts/1')
}
// fetchData();


console.log('\n=== 🎯 Challenge: Retry function ===');
// TODO: Create a retry function that attempts an async operation
// up to N times before giving up
async function retry(fn, maxAttempts = 3) {
  // Your code here:
}

// Test it (uncomment):
// let attempts = 0;
// retry(async () => {
//   attempts++;
//   if (attempts < 3) throw new Error('Fail');
//   return 'Success!';
// }).then(console.log);


console.log('\n=== 🎯 Challenge: Timeout wrapper ===');
// TODO: Create a function that adds a timeout to any promise
function withTimeout(promise, timeoutMs) {
  // Your code here:
  // Hint: Use Promise.race()
}

// Test it (uncomment):
// const slowPromise = new Promise(resolve => setTimeout(() => resolve('Done'), 2000));
// withTimeout(slowPromise, 1000)
//   .then(console.log)
//   .catch(err => console.log('Timeout!', err.message));


console.log('\n=== 🎯 Challenge: Process sequentially ===');
// TODO: Process array items one by one (sequentially)
async function processSequentially(items, asyncFn) {
  // Your code here:
}

// Test it (uncomment):
// const items = [1, 2, 3];
// processSequentially(items, async (item) => {
//   await new Promise(resolve => setTimeout(resolve, 500));
//   return item * 2;
// }).then(console.log); // Should be [2, 4, 6]


console.log('\n=== 🎯 Challenge: Batch processing ===');
// TODO: Process items in batches of N at a time
async function processBatches(items, asyncFn, batchSize) {
  // Your code here:
  // Hint: Split into batches, use Promise.all() for each batch
}

// Test it (uncomment):
// const items = [1, 2, 3, 4, 5, 6];
// processBatches(items, async (item) => {
//   await new Promise(resolve => setTimeout(resolve, 500));
//   return item * 2;
// }, 2).then(console.log); // Process 2 at a time


console.log('\n✅ Exercises completed! Check your answers with a mentor.');
