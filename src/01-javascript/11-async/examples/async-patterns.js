// ============================================
// ASYNC PATTERNS Examples
// ============================================

console.log('=== 1. Sequential vs Parallel ===');

// Simulate async operations
function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

// Sequential - one after another (slower)
async function sequential() {
  console.time('sequential');
  const result1 = await delay(1000, 'First');
  const result2 = await delay(1000, 'Second');
  const result3 = await delay(1000, 'Third');
  console.timeEnd('sequential'); // ~3 seconds
  return [result1, result2, result3];
}

// Parallel - all at once (faster)
async function parallel() {
  console.time('parallel');
  const [result1, result2, result3] = await Promise.all([
    delay(1000, 'First'),
    delay(1000, 'Second'),
    delay(1000, 'Third')
  ]);
  console.timeEnd('parallel'); // ~1 second
  return [result1, result2, result3];
}

// Run them
(async () => {
  await sequential();
  await parallel();
})();

console.log('\n=== 2. Promise.all() ===');

async function demoPromiseAll() {
  const promises = [
    delay(100, 'A'),
    delay(200, 'B'),
    delay(150, 'C')
  ];

  // Wait for all to complete
  const results = await Promise.all(promises);
  console.log('All results:', results); // ['A', 'B', 'C']

  // If ANY fails, entire Promise.all fails
  try {
    await Promise.all([
      delay(100, 'Success'),
      Promise.reject('Error!'),
      delay(200, 'Never reached')
    ]);
  } catch (error) {
    console.log('Promise.all failed:', error);
  }
}

setTimeout(demoPromiseAll, 3500);

console.log('\n=== 3. Promise.race() ===');

async function demoPromiseRace() {
  // Returns first completed (resolved or rejected)
  const result = await Promise.race([
    delay(300, 'Slow'),
    delay(100, 'Fast'),
    delay(200, 'Medium')
  ]);
  console.log('Winner:', result); // 'Fast'

  // Timeout pattern
  async function fetchWithTimeout(url, timeout) {
    return Promise.race([
      fetch(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }
}

setTimeout(demoPromiseRace, 4000);

console.log('\n=== 4. Promise.allSettled() ===');

async function demoAllSettled() {
  // Wait for all, never fails
  const results = await Promise.allSettled([
    delay(100, 'Success 1'),
    Promise.reject('Error!'),
    delay(200, 'Success 2')
  ]);

  console.log('All settled:', results);
  // [
  //   { status: 'fulfilled', value: 'Success 1' },
  //   { status: 'rejected', reason: 'Error!' },
  //   { status: 'fulfilled', value: 'Success 2' }
  // ]

  // Process results
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Promise ${i}: ${result.value}`);
    } else {
      console.log(`Promise ${i} failed: ${result.reason}`);
    }
  });
}

setTimeout(demoAllSettled, 4500);

console.log('\n=== 5. Error Handling Patterns ===');

async function demoErrorHandling() {
  // Try-catch for each operation
  try {
    const result = await delay(100, 'Success');
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Try-catch for multiple operations
  try {
    const result1 = await delay(100, 'First');
    const result2 = await Promise.reject('Failed!');
    const result3 = await delay(100, 'Never reached');
  } catch (error) {
    console.error('Caught error:', error);
  }

  // Helper function for safe async calls
  async function safeAsync(fn, fallback) {
    try {
      return await fn();
    } catch (error) {
      console.error('Error, using fallback:', error);
      return fallback;
    }
  }

  const result = await safeAsync(
    () => Promise.reject('Oops'),
    'Default value'
  );
  console.log('Safe result:', result);
}

setTimeout(demoErrorHandling, 5000);

console.log('\n=== 6. Retry Pattern ===');

async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await delay(delayMs);
    }
  }
}

// Usage
setTimeout(async () => {
  let attempts = 0;
  try {
    await retry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return 'Success!';
    });
    console.log('Retry succeeded');
  } catch (error) {
    console.log('All retries failed');
  }
}, 5500);

console.log('\n=== 7. Queue/Sequential Processing ===');

async function processSequentially(items, processor) {
  const results = [];
  for (const item of items) {
    const result = await processor(item);
    results.push(result);
  }
  return results;
}

setTimeout(async () => {
  const items = [1, 2, 3, 4, 5];
  const results = await processSequentially(items, async (item) => {
    await delay(100);
    return item * 2;
  });
  console.log('Sequential results:', results);
}, 6500);

console.log('\n=== 8. Concurrent with Limit ===');

async function processConcurrent(items, processor, concurrency = 2) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

setTimeout(async () => {
  const items = [1, 2, 3, 4, 5, 6];
  const results = await processConcurrent(items, async (item) => {
    await delay(500);
    return item * 2;
  }, 2);
  console.log('Concurrent results:', results);
}, 7500);

console.log('\n=== Best Practices ===');
console.log('1. Use async/await for better readability');
console.log('2. Use Promise.all() for parallel operations');
console.log('3. Use Promise.allSettled() when you need all results');
console.log('4. Use Promise.race() for timeouts');
console.log('5. Always handle errors with try-catch');
console.log('6. Be mindful of sequential vs parallel execution');
console.log('7. Use retry patterns for flaky operations');
console.log('8. Limit concurrency for resource-intensive operations');
