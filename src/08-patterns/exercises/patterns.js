// ============================================
// DESIGN PATTERNS — Exercises
// ============================================

// ---
// Exercise 1: Singleton — Config Store
// Create a Config class where all instances are the same object.
// config.set('debug', true) on one instance should be visible from another.

class Config {
  // TODO: make this a Singleton
  set(key, value) { /* TODO */ }
  get(key) { /* TODO */ }
}

const c1 = new Config();
const c2 = new Config();
c1.set('debug', true);
console.log(c2.get('debug')); // true
console.log(c1 === c2);       // true

// ---
// Exercise 2: Factory — Shape creator
// Create a factory function createShape(type, ...args) that returns
// different shape objects: circle, rectangle, triangle
// Each shape must have an area() method.

function createShape(type, ...args) {
  // TODO
  // 'circle', radius      → { area: () => Math.PI * r * r }
  // 'rectangle', w, h     → { area: () => w * h }
  // 'triangle', base, h   → { area: () => 0.5 * base * h }
}

console.log(createShape('circle', 5).area().toFixed(2));      // 78.54
console.log(createShape('rectangle', 4, 6).area());           // 24
console.log(createShape('triangle', 3, 8).area());            // 12

// ---
// Exercise 3: Builder — HTTP Request Builder
// Build a fluent builder for HTTP requests.

class RequestBuilder {
  // TODO: store method, url, headers, body
  // method(m) { ... return this; }
  // url(u)    { ... return this; }
  // header(k, v) { ... return this; }
  // body(data)   { ... return this; }
  // build() { return { method, url, headers, body } }
}

const req = new RequestBuilder()
  .method('POST')
  .url('/api/users')
  .header('Content-Type', 'application/json')
  .header('Authorization', 'Bearer token123')
  .body({ name: 'Alice' })
  .build();

console.log(req.method);  // 'POST'
console.log(req.url);     // '/api/users'
console.log(req.headers); // { 'Content-Type': 'application/json', Authorization: 'Bearer token123' }
console.log(req.body);    // { name: 'Alice' }

// ---
// Exercise 4: Observer — Stock ticker
// Create a StockTicker that emits 'price' events.
// Multiple subscribers should receive updates.

class StockTicker {
  // TODO: implement subscribe(fn) and updatePrice(newPrice)
}

const ticker = new StockTicker();
const prices = [];

const unsubscribe = ticker.subscribe(price => prices.push(`A:${price}`));
ticker.subscribe(price => prices.push(`B:${price}`));

ticker.updatePrice(100);
ticker.updatePrice(105);
unsubscribe();
ticker.updatePrice(110); // only B receives this

console.log(prices); // ['A:100', 'B:100', 'A:105', 'B:105', 'B:110']

// ---
// Exercise 5: Strategy — Discount calculator
// Implement different discount strategies.

function applyDiscount(price, strategy) {
  // TODO: strategy is a function that takes price and returns discounted price
}

const tenPercent = /* TODO: function */ null;
const halfOff    = /* TODO: function */ null;
const noDiscount = /* TODO: function */ null;

console.log(applyDiscount(100, tenPercent)); // 90
console.log(applyDiscount(100, halfOff));    // 50
console.log(applyDiscount(100, noDiscount)); // 100

// ---
// Exercise 6: Proxy — Auto-validate object
// Create a function makeUser(data) that returns a Proxy.
// Setting 'email' must contain '@', otherwise throw TypeError.
// Setting 'age' must be a number between 0 and 150.

function makeUser(data) {
  // TODO: return new Proxy(data, { set(target, key, value) { ... } })
}

const user = makeUser({ name: 'Alice' });
user.name = 'Bob';    // ok

try { user.email = 'notanemail'; }
catch (e) { console.log(e.message); } // 'Invalid email'

user.email = 'bob@example.com'; // ok
console.log(user.email); // 'bob@example.com'

try { user.age = 200; }
catch (e) { console.log(e.message); } // 'Invalid age'

// ---
// Challenge: Decorator — Rate limiter
// Wrap any async function so it can be called at most N times per second.
// If called more often — throw an Error('Rate limit exceeded').

function rateLimit(fn, maxPerSecond) {
  // TODO
}

// ---
// Challenge: Command with history
// Implement a simple counter with undo/redo.
// Commands: increment(n), decrement(n)

class Counter {
  value = 0;
  // TODO: execute(command), undo(), redo()
}

const counter = new Counter();
// counter.execute(increment(5));
// console.log(counter.value); // 5
// counter.execute(increment(3));
// console.log(counter.value); // 8
// counter.undo();
// console.log(counter.value); // 5
// counter.redo();
// console.log(counter.value); // 8
