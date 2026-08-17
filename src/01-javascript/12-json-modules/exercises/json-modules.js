// ============================================
// JSON & MODULES Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/12-json-modules/exercises/json-modules.js

console.log('=== Exercise 1: JSON.stringify basics ===');
// TODO: Serialize the object below to a JSON string
// Then log: the type of result, its length, and the string itself
const product = {
  id: 101,
  name: 'Laptop',
  price: 999.99,
  inStock: true,
  tags: ['electronics', 'computers'],
};
// Your code here:
const productString = JSON.stringify(product);
console.log(typeof productString);
console.log(productString.length);
console.log(productString);

console.log('\n=== Exercise 2: Pretty print JSON ===');
// TODO: Serialize the product from Ex1 with 2-space indentation
// and log the result
// Your code here:
// null - replacer
// 2 - whitespaces
const prettyProductString = JSON.stringify(product, null, 2);
console.log(prettyProductString);

console.log('\n=== Exercise 3: JSON.parse ===');
// TODO: Parse this JSON string and log each field separately
const jsonString = '{"name":"Alice","age":30,"skills":["JS","TS","React"],"active":true}';
// Your code here:
// Expected: name=Alice, age=30, skills count=3, active=true
const parsed = JSON.parse(jsonString);
console.log(
  `name=${parsed.name}, age=${parsed.age}, skills count=${parsed.skills.length}, active=${parsed.active}`
);

console.log('\n=== Exercise 4: Safe JSON parse ===');
// TODO: Write a safeJsonParse(str) function
// Returns parsed object on success, null on failure (no throwing)
function safeJsonParse(str) {
  // Your code here
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
}
console.log(safeJsonParse('{"name":"Bob"}')); // { name: 'Bob' }
console.log(safeJsonParse('{invalid json}')); // null
console.log(safeJsonParse('null')); // null
console.log(safeJsonParse('"hello"')); // 'hello'

console.log('\n=== Exercise 5: Replacer — hide sensitive data ===');
// TODO: Serialize the user below but EXCLUDE password and ssn fields
// Use the replacer argument of JSON.stringify
const sensitiveUser = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  password: 'secret123',
  ssn: '123-45-6789',
  role: 'admin',
};
// Your code here (only id, username, email, role should appear in output):
const safe = JSON.stringify(sensitiveUser, ['id', 'username', 'email', 'role'], 2);
console.log(safe);

console.log('\n=== Exercise 6: Reviver — restore dates ===');
// TODO: Parse the JSON below and use a reviver to convert
// "createdAt" and "updatedAt" strings to actual Date objects
const eventJson =
  '{"title":"Conference","createdAt":"2024-03-15T09:00:00.000Z","updatedAt":"2024-03-16T14:30:00.000Z","attendees":150}';
// Your code here:
// Verify: parsed.createdAt instanceof Date should be true
const result = JSON.parse(eventJson, (key, value) => {
  if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
    return new Date(value);
  }
  return value;
});
console.log(result);
console.log('createdAt is Date:', result.createdAt instanceof Date);
console.log('uptedAt is Date:', result.updatedAt instanceof Date);

console.log('\n=== Exercise 7: Deep clone with JSON ===');
// TODO: Deep clone the nested object using JSON
// Modify the clone and verify the original is unchanged
const original = {
  name: 'Config',
  settings: {
    theme: 'dark',
    notifications: { email: true, sms: false },
  },
  tags: ['production', 'v2'],
};
// Your code here:
const clone = JSON.parse(JSON.stringify(original));
// Modify clone.settings.theme and clone.tags[0]
clone.settings.theme = 'light';
clone.tags[0] = 'debug';
// Log original to confirm it's unchanged
console.log(original);

console.log('\n=== Exercise 8: toJSON() custom serialization ===');
// TODO: Add a toJSON() method to the class below
// toJSON should return only { id, name } (not the internal cache)
class ApiResource {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this._cache = { lastFetched: Date.now(), data: 'internal' }; // should be hidden
  }
  // Add toJSON() here
  toJSON() {
    return { id: this.id, name: this.name };
  }
}
const resource = new ApiResource(1, 'Users');
const json = JSON.stringify(resource);
console.log(json); // Should be: {"id":1,"name":"Users"}

console.log('\n=== Exercise 9: Module pattern (simulate exports) ===');
// TODO: Create a calculator "module" using a factory function
// It should export: add, subtract, multiply, divide
// divide should throw if divisor is 0
// This simulates what you'd put in a separate file and export
function createCalculator() {
  // Your code here — return an object with add, subtract, multiply, divide
  return {
    add(a, b) {
      return a + b;
    },
    subtract(a, b) {
      return a - b;
    },
    multiply(a, b) {
      return a * b;
    },
    divide(a, b) {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    },
  };
}
const calc = createCalculator();
console.log(calc.add(10, 5)); // 15
console.log(calc.subtract(10, 5)); // 5
console.log(calc.multiply(4, 3)); // 12
console.log(calc.divide(10, 2)); // 5
//calc.divide(5, 0); // Should throw Error

console.log('\n=== 🎯 Challenge: Config file parser ===');
// TODO: Create a parseConfig(jsonString) function that:
// 1. Parses the JSON string safely
// 2. Validates required fields: host (string), port (number), debug (boolean)
// 3. Returns the config if valid
// 4. Throws a descriptive error if invalid or missing fields
function parseConfig(jsonString) {
  // Your code here
  let config;
  try {
    config = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON data');
  }
  const required = ['host', 'port', 'debug'];
  const missing = required.filter((key) => !(key in config));
  if (missing.length) {
    throw new Error('Missing required fields: ' + missing.join(', '));
  }
  if (typeof config.host !== 'string') {
    throw new Error('Invalid types: host must be string');
  }
  if (typeof config.port !== 'number') {
    throw new Error('Invalid types: port must be number');
  }
  if (typeof config.debug !== 'boolean') {
    throw new Error('Invalid types: debug must be boolean');
  }
  return config;
}

// Test:
const valid = '{"host":"localhost","port":3000,"debug":true,"extra":"ok"}';
const invalid1 = '{bad json}';
const invalid2 = '{"host":"localhost"}'; // missing port and debug
const invalid3 = '{"host":123,"port":"abc","debug":true}'; // wrong types
try {
  console.log(parseConfig(valid)); // { host: 'localhost', port: 3000, debug: true, extra: 'ok' }
  //parseConfig(invalid1); // throws: Invalid JSON
  //parseConfig(invalid2); // throws: Missing required fields: port, debug
  parseConfig(invalid3); // throws: Invalid types: host must be string, port must be number
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n=== 🎯 Challenge: Serialize/deserialize class instances ===');
// TODO: Make the Point class survive JSON serialization/deserialization
// After JSON round-trip, it should still be a Point with distanceTo() method
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }

  // TODO: Add toJSON() to control serialization
  // TODO: Add static fromJSON(json) to restore from JSON string
  toJSON() {
    return { x: this.x, y: this.y };
  }

  static fromJSON(json) {
    let obj = typeof json === 'string' ? JSON.parse(json) : json;
    return new Point(obj.x, obj.y);
  }
}

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
const json1 = p1.toJSON();
const restored = Point.fromJSON(json1);
console.log(restored instanceof Point); // true
console.log(restored.distanceTo(p2)); // 5

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
