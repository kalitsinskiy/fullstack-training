// ============================================
// CREATIONAL PATTERNS
// ============================================

// ============================================
// 1. Singleton — only one instance
// ============================================
// Use cases: config, logger, database connection pool, cache

class Logger {
  static #instance = null;
  #logs = [];

  constructor() {
    if (Logger.#instance) {
      return Logger.#instance; // return existing
    }
    Logger.#instance = this;
  }

  log(message) {
    const entry = { message, time: new Date().toISOString() };
    this.#logs.push(entry);
    console.log(`[LOG] ${message}`);
  }

  getLogs() { return [...this.#logs]; }

  static reset() { Logger.#instance = null; } // for testing
}

console.log('=== Singleton ===');
const log1 = new Logger();
const log2 = new Logger();
console.log(log1 === log2); // true — same instance

log1.log('App started');
log2.log('User logged in');
console.log(log1.getLogs().length); // 2 — both logged to same instance

// Module-style Singleton (simpler, more common in JS):
const config = (() => {
  const _private = { env: 'development', maxRetries: 3 };
  return {
    get: (key) => _private[key],
    set: (key, value) => { _private[key] = value; },
  };
})();

config.set('env', 'production');
console.log(config.get('env')); // 'production'

// ============================================
// 2. Factory — create objects without new
// ============================================
// Use cases: when the type varies based on input, when hiding constructor details

class Dog { speak() { return 'Woof'; } }
class Cat { speak() { return 'Meow'; } }
class Bird { speak() { return 'Tweet'; } }

function createAnimal(type) {
  const animals = { dog: Dog, cat: Cat, bird: Bird };
  const AnimalClass = animals[type];
  if (!AnimalClass) throw new Error(`Unknown animal: ${type}`);
  return new AnimalClass();
}

console.log('\n=== Factory ===');
const dog = createAnimal('dog');
const cat = createAnimal('cat');
console.log(dog.speak()); // 'Woof'
console.log(cat.speak()); // 'Meow'

// Abstract factory — create families of related objects
function createUIKit(theme) {
  const themes = {
    dark: {
      button: () => ({ render: () => '[ DARK BUTTON ]', color: '#333' }),
      input:  () => ({ render: () => '[ dark input ]',  bg: '#222' }),
    },
    light: {
      button: () => ({ render: () => '[ Light Button ]', color: '#eee' }),
      input:  () => ({ render: () => '[ Light Input ]',  bg: '#fff' }),
    },
  };
  return themes[theme] ?? themes.light;
}

const dark = createUIKit('dark');
console.log(dark.button().render()); // '[ DARK BUTTON ]'

// ============================================
// 3. Builder — step-by-step construction
// ============================================
// Use cases: complex objects with many optional fields, query builders, config

class QueryBuilder {
  #table = '';
  #conditions = [];
  #fields = ['*'];
  #limitVal = null;
  #orderByVal = null;

  from(table) { this.#table = table; return this; }  // returns this → chaining
  select(...fields) { this.#fields = fields; return this; }
  where(condition) { this.#conditions.push(condition); return this; }
  limit(n) { this.#limitVal = n; return this; }
  orderBy(field, dir = 'ASC') { this.#orderByVal = `${field} ${dir}`; return this; }

  build() {
    if (!this.#table) throw new Error('Table is required');
    let query = `SELECT ${this.#fields.join(', ')} FROM ${this.#table}`;
    if (this.#conditions.length) query += ` WHERE ${this.#conditions.join(' AND ')}`;
    if (this.#orderByVal) query += ` ORDER BY ${this.#orderByVal}`;
    if (this.#limitVal)   query += ` LIMIT ${this.#limitVal}`;
    return query;
  }
}

console.log('\n=== Builder ===');
const query = new QueryBuilder()
  .from('users')
  .select('id', 'name', 'email')
  .where('active = true')
  .where('age > 18')
  .orderBy('name')
  .limit(10)
  .build();

console.log(query);
// SELECT id, name, email FROM users WHERE active = true AND age > 18 ORDER BY name ASC LIMIT 10

// Without builder — hard to read with many optional params:
// createQuery('users', ['id','name','email'], ['active=true','age>18'], 'name', 'ASC', 10)
