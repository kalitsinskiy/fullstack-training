// ============================================
// STRUCTURAL PATTERNS
// ============================================

// ============================================
// 1. Adapter — make incompatible interfaces work together
// ============================================
// Use cases: integrating third-party APIs, legacy code, library changes

// Old logger interface: logger.log('message')
class OldLogger {
  log(message) { console.log(`[OLD] ${message}`); }
}

// New app expects: logger.info() / logger.warn() / logger.error()
class LoggerAdapter {
  #logger;

  constructor(oldLogger) {
    this.#logger = oldLogger;
  }

  info(msg)  { this.#logger.log(`INFO: ${msg}`); }
  warn(msg)  { this.#logger.log(`WARN: ${msg}`); }
  error(msg) { this.#logger.log(`ERROR: ${msg}`); }
}

console.log('=== Adapter ===');
const adapted = new LoggerAdapter(new OldLogger());
adapted.info('Server started');   // [OLD] INFO: Server started
adapted.error('Connection lost'); // [OLD] ERROR: Connection lost

// API shape adapter — real-world: adapting different payment providers
function stripeAdapter(stripeCharge) {
  // Stripe returns: { id, amount, currency, status }
  // Our app expects: { transactionId, total, currency, paid }
  return {
    transactionId: stripeCharge.id,
    total: stripeCharge.amount / 100, // stripe uses cents
    currency: stripeCharge.currency.toUpperCase(),
    paid: stripeCharge.status === 'succeeded',
  };
}

const stripeResponse = { id: 'ch_123', amount: 4999, currency: 'usd', status: 'succeeded' };
console.log(stripeAdapter(stripeResponse));
// { transactionId: 'ch_123', total: 49.99, currency: 'USD', paid: true }

// ============================================
// 2. Decorator — add behavior without changing the original
// ============================================
// Use cases: middleware, logging wrappers, caching wrappers, retry logic

// Base component
class DataService {
  async fetch(url) {
    console.log(`  Fetching: ${url}`);
    return { data: 'result', url }; // simulated response
  }
}

// Decorator 1: logging
class LoggingDecorator {
  #service;

  constructor(service) { this.#service = service; }

  async fetch(url) {
    console.log(`[LOG] Request to: ${url}`);
    const result = await this.#service.fetch(url);
    console.log('[LOG] Response received');
    return result;
  }
}

// Decorator 2: caching
class CachingDecorator {
  #service;
  #cache = new Map();

  constructor(service) { this.#service = service; }

  async fetch(url) {
    if (this.#cache.has(url)) {
      console.log(`[CACHE] Hit: ${url}`);
      return this.#cache.get(url);
    }
    const result = await this.#service.fetch(url);
    this.#cache.set(url, result);
    return result;
  }
}

console.log('\n=== Decorator ===');
// Stack decorators: cache → log → real service
const service = new CachingDecorator(
  new LoggingDecorator(
    new DataService()
  )
);

(async () => {
  await service.fetch('/api/users'); // misses cache → logs → fetches
  await service.fetch('/api/users'); // hits cache
})();

// Functional decorator approach (simpler):
function withRetry(fn, maxAttempts = 3) {
  return async (...args) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        console.log(`Retry ${attempt}/${maxAttempts}...`);
      }
    }
  };
}

// ============================================
// 3. Proxy — control access to an object
// ============================================
// Use cases: validation, logging, lazy loading, read-only views

console.log('\n=== Proxy ===');

// Validation proxy
function createValidatedUser(data) {
  return new Proxy(data, {
    set(target, key, value) {
      if (key === 'age' && (typeof value !== 'number' || value < 0)) {
        throw new TypeError('age must be a non-negative number');
      }
      if (key === 'name' && typeof value !== 'string') {
        throw new TypeError('name must be a string');
      }
      target[key] = value;
      return true;
    },
  });
}

const user = createValidatedUser({ name: 'Alice', age: 25 });
user.age = 30;    // ok
console.log(user.age); // 30
try { user.age = -1; } catch (e) { console.log(e.message); } // age must be...

// Read-only proxy
function readOnly(obj) {
  return new Proxy(obj, {
    set() { throw new Error('This object is read-only'); },
    deleteProperty() { throw new Error('This object is read-only'); },
  });
}

const frozen = readOnly({ x: 1, y: 2 });
console.log(frozen.x); // 1
try { frozen.x = 99; } catch (e) { console.log(e.message); } // read-only

// Logging proxy
function withLogging(obj, name = 'obj') {
  return new Proxy(obj, {
    get(target, key) {
      console.log(`[PROXY] ${name}.${String(key)} accessed`);
      return target[key];
    },
  });
}

const tracked = withLogging({ count: 0 }, 'counter');
tracked.count; // [PROXY] counter.count accessed
