// ============================================
// PRACTICAL CLOSURES Examples
// ============================================

console.log('=== 1. Factory Functions ===');

function createMultiplier(factor) {
  return (number) => number * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
const percent = createMultiplier(0.01);

console.log('double(5):', double(5));    // 10
console.log('triple(5):', triple(5));    // 15
console.log('percent(75):', percent(75)); // 0.75

// More complex factory
function createUser(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage'],
    editor: ['read', 'write'],
    viewer: ['read']
  };

  const userPermissions = permissions[role] || [];

  return {
    role,
    can(action) { return userPermissions.includes(action); },
    getPermissions() { return [...userPermissions]; }
  };
}

const admin = createUser('admin');
const viewer = createUser('viewer');

console.log('admin can delete:', admin.can('delete'));   // true
console.log('viewer can delete:', viewer.can('delete')); // false
console.log('viewer permissions:', viewer.getPermissions());

console.log('\n=== 2. Memoization ===');

// Cache expensive function results
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`  Cache hit for (${args})`);
      return cache.get(key);
    }

    console.log(`  Computing for (${args})...`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Slow fibonacci without memoization
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Fast fibonacci with memoization
const fastFib = memoize(function fib(n) {
  if (n <= 1) return n;
  return fastFib(n - 1) + fastFib(n - 2);
});

console.log('fib(10):', fastFib(10)); // Computes
console.log('fib(10):', fastFib(10)); // Cache hit
console.log('fib(5):', fastFib(5));   // Cache hit (computed during fib(10))

console.log('\n=== 3. Partial Application ===');

// Pre-fill some arguments
function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

function add(a, b, c) {
  return a + b + c;
}

const add5 = partial(add, 5);
const add5and10 = partial(add, 5, 10);

console.log('add5(3, 2):', add5(3, 2));      // 10
console.log('add5and10(1):', add5and10(1));  // 16

// Practical partial application
function fetchWithHeaders(headers, url, options = {}) {
  return `Fetching ${url} with ${JSON.stringify(headers)}`;
}

const fetchWithAuth = partial(fetchWithHeaders, {
  Authorization: 'Bearer token123',
  'Content-Type': 'application/json'
});

console.log(fetchWithAuth('https://jsonplaceholder.typicode.com/users'));
console.log(fetchWithAuth('https://jsonplaceholder.typicode.com/posts'));

console.log('\n=== 4. Once Function ===');

// Function that can only be called once
function once(fn) {
  let called = false;
  let result;

  return function(...args) {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

const initializeApp = once(() => {
  console.log('App initialized!');
  return { initialized: true };
});

console.log(initializeApp()); // 'App initialized!' + result
console.log(initializeApp()); // Just returns result (no log)
console.log(initializeApp()); // Same

console.log('\n=== 5. Rate Limiting / Throttle ===');

function throttle(fn, delay) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
    console.log('Throttled!');
  };
}

const log = throttle((msg) => console.log('LOG:', msg), 100);

log('First');   // Logged
log('Second');  // Throttled
log('Third');   // Throttled
setTimeout(() => log('After delay'), 150); // Logged

console.log('\n=== 6. Event Listener Management ===');

function createEventManager() {
  const listeners = {};

  return {
    on(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return () => this.off(event, callback); // Returns unsubscribe fn
    },
    off(event, callback) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    },
    emit(event, data) {
      (listeners[event] || []).forEach(cb => cb(data));
    }
  };
}

const events = createEventManager();

const unsubscribe = events.on('click', (data) => console.log('Clicked:', data));
events.on('click', (data) => console.log('Also clicked:', data));

events.emit('click', { x: 10, y: 20 });

unsubscribe(); // Remove first listener
events.emit('click', { x: 30, y: 40 }); // Only second runs

console.log('\n=== 7. Configuration Builder ===');

// Using closures to build configuration
function createConfig() {
  let config = {};

  const builder = {
    set(key, value) {
      config = { ...config, [key]: value };
      return builder; // Return this for chaining
    },
    build() {
      return Object.freeze({ ...config }); // Immutable copy
    }
  };

  return builder;
}

const serverConfig = createConfig()
  .set('host', 'localhost')
  .set('port', 3000)
  .set('debug', true)
  .build();

console.log('Config:', serverConfig);
// serverConfig.port = 8080; // Throws (frozen)

console.log('\n=== Best Practices ===');
console.log('1. Use closures to create private state');
console.log('2. Use memoize for expensive pure functions');
console.log('3. Use partial application to reduce repeated arguments');
console.log('4. Use once() for initialization code that runs once');
console.log('5. Use throttle/debounce for rate-limited event handlers');
console.log('6. Be careful with closures in loops — use let or capture correctly');
console.log('7. Remember: closures keep their scope alive (memory consideration)');
