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
const jsonResult = JSON.stringify(product);

console.log('Result Type:', typeof jsonResult); // string
console.log('Result Length:', jsonResult.length);
console.log('Stringified Object:', jsonResult);

console.log('\n=== Exercise 2: Pretty print JSON ===');
// TODO: Serialize the product from Ex1 with 2-space indentation
// and log the result
// Your code here:
const jsonResultPretty = JSON.stringify(product, null, 2);

console.log('Stringified Pretty Object:', jsonResultPretty);

console.log('\n=== Exercise 3: JSON.parse ===');
// TODO: Parse this JSON string and log each field separately
const jsonString = '{"name":"Alice","age":30,"skills":["JS","TS","React"],"active":true}';
// Your code here:
// Expected: name=Alice, age=30, skills count=3, active=true
try {
  const data = JSON.parse(jsonString);
  console.log(
    `name=${data.name}, age=${data.age}, skills count=${data.skills.length}, active=${data.active}`
  );
} catch (error) {
  console.error('JSON Parsing error:', error.message);
}

console.log('\n=== Exercise 4: Safe JSON parse ===');
// TODO: Write a safeJsonParse(str) function
// Returns parsed object on success, null on failure (no throwing)
function safeJsonParse(str) {
  // Your code here
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON Parsing error:', error.message);
  }

  return null;
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
const filtered = JSON.stringify(sensitiveUser, ['id', 'username', 'email', 'role'], 2);
console.log('User (with filtered data):', filtered);

const replaced = JSON.stringify(
  sensitiveUser,
  (key, value) => {
    if (key === 'password') return '*****';
    if (key === 'ssn') return null;

    return value;
  },
  2
);

console.log('User (with replaced data):', replaced);

console.log('\n=== Exercise 6: Reviver — restore dates ===');
// TODO: Parse the JSON below and use a reviver to convert
// "createdAt" and "updatedAt" strings to actual Date objects
const eventJson =
  '{"title":"Conference","createdAt":"2024-03-15T09:00:00.000Z","updatedAt":"2024-03-16T14:30:00.000Z","attendees":150}';
// Your code here:
// Verify: parsed.createdAt instanceof Date should be true
const eventData = JSON.parse(eventJson, (key, value) => {
  if (key === 'createdAt' || key === 'updatedAt') return new Date(value);

  return value;
});

console.log('Event Data:', eventData);
console.log('createdAt is instance of Date:', eventData.createdAt instanceof Date);

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
clone.tags[0] = 'staging';

// Log original to confirm it's unchanged
console.log('Original:', original);

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
    return {
      id: this.id,
      name: this.name,
    };
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
    add: (a, b) => a + b,

    subtract: (a, b) => a - b,

    multiply: (a, b) => a * b,

    divide: (a, b) => {
      if (b === 0) {
        throw new Error('Divide by zero.');
      }
      return a / b;
    },
  };
}

try {
  const calc = createCalculator();
  console.log(calc.add(10, 5)); // 15
  console.log(calc.subtract(10, 5)); // 5
  console.log(calc.multiply(4, 3)); // 12
  console.log(calc.divide(10, 2)); // 5
  calc.divide(5, 0); // Should throw Error
} catch (error) {
  console.error('Error:', error.message);
}

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
  } catch (error) {
    throw new Error(error.message);
  }

  const errors = [];
  const schema = {
    host: 'string',
    port: 'number',
    debug: 'boolean',
  };

  Object.entries(schema).forEach(([field, type]) => {
    if (!(field in config)) {
      errors.push(`Missing ${field}`);
    } else if (typeof config[field] !== type) {
      errors.push(`${field} must be a type ${type}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
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
  // parseConfig(invalid1); // throws: Invalid JSON
  // parseConfig(invalid2); // throws: Missing required fields: port, debug
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
    return {
      x: this.x,
      y: this.y,
    };
  }

  static fromJSON(data) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    return new Point(parsed.x, parsed.y);
  }
}

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
const jsonStr = p1.toJSON();
const restored = Point.fromJSON(jsonStr);
console.log(restored instanceof Point); // true
console.log(restored.distanceTo(p2)); // 5

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
