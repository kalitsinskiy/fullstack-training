// ============================================
// OBJECT OPERATIONS Examples
// ============================================

console.log('=== 1. Object.keys() ===');

const user = {
  name: 'Alice',
  age: 25,
  city: 'London'
};

// Get array of keys
const keys = Object.keys(user);
console.log('Keys:', keys); // ['name', 'age', 'city']

// Use in loop
Object.keys(user).forEach(key => {
  console.log(`${key}: ${user[key]}`);
});

console.log('\n=== 2. Object.values() ===');

// Get array of values
const values = Object.values(user);
console.log('Values:', values); // ['Alice', 25, 'London']

// Sum numeric values
const scores = { math: 90, english: 85, science: 92 };
const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
console.log('Total score:', total);

console.log('\n=== 3. Object.entries() ===');

// Get array of [key, value] pairs
const entries = Object.entries(user);
console.log('Entries:', entries);
// [['name', 'Alice'], ['age', 25], ['city', 'London']]

// Convert to Map
const userMap = new Map(Object.entries(user));
console.log('As Map:', userMap);

// Iterate with destructuring
Object.entries(user).forEach(([key, value]) => {
  console.log(`${key} = ${value}`);
});

console.log('\n=== 4. Object.assign() ===');

const target = { a: 1, b: 2 };
const source = { b: 3, c: 4 };

// Merge objects (modifies target!)
Object.assign(target, source);
console.log('Target:', target); // { a: 1, b: 3, c: 4 }

// Copy to new object
const obj1 = { x: 1 };
const obj2 = { y: 2 };
const merged = Object.assign({}, obj1, obj2);
console.log('Merged:', merged); // { x: 1, y: 2 }

// Multiple sources
const result = Object.assign({}, { a: 1 }, { b: 2 }, { c: 3 });
console.log('Multiple sources:', result);

console.log('\n=== 5. Object.freeze() ===');

const config = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  timeout: 5000
};

// Make immutable
Object.freeze(config);

// Attempts to modify fail silently (or throw in strict mode)
config.apiUrl = 'https://hacker.com';
config.newProp = 'test';
delete config.timeout;

console.log('After freeze:', config); // Unchanged

// Check if frozen
console.log('Is frozen?', Object.isFrozen(config)); // true

// Shallow freeze only!
const nested = {
  outer: 'frozen',
  inner: { mutable: 'yes' }
};

Object.freeze(nested);
nested.inner.mutable = 'changed'; // Works!
console.log('Nested:', nested.inner.mutable); // 'changed'

console.log('\n=== 6. Object.seal() ===');

const product = {
  name: 'Laptop',
  price: 1000
};

// Seal object
Object.seal(product);

// Can modify existing properties
product.price = 900;
console.log('Modified price:', product.price); // 900

// Cannot add new properties
product.brand = 'Dell'; // Fails
console.log('Has brand?', product.brand); // undefined

// Cannot delete properties
delete product.name; // Fails
console.log('After delete:', product); // Still has name

// Check if sealed
console.log('Is sealed?', Object.isSealed(product)); // true

console.log('\n=== 7. Object.create() ===');

// Create object with specific prototype
const personProto = {
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

const alice = Object.create(personProto);
alice.name = 'Alice';
alice.greet(); // Uses inherited method

// Create object with no prototype
const bareObject = Object.create(null);
bareObject.x = 1;
console.log('No prototype:', bareObject);
// console.log(bareObject.toString); // undefined (no inherited methods)

console.log('\n=== 8. Object.fromEntries() ===');

// Convert entries to object
const entries2 = [
  ['name', 'Bob'],
  ['age', 30],
  ['city', 'Paris']
];

const obj = Object.fromEntries(entries2);
console.log('From entries:', obj);

// Convert Map to object
const map = new Map([
  ['x', 1],
  ['y', 2]
]);

const fromMap = Object.fromEntries(map);
console.log('From Map:', fromMap);

// Practical: filter object properties
const allData = { a: 1, b: 2, c: 3, d: 4 };
const filtered = Object.fromEntries(
  Object.entries(allData).filter(([key, value]) => value > 2)
);
console.log('Filtered:', filtered); // { c: 3, d: 4 }

console.log('\n=== 9. Object.hasOwn() (modern) ===');

const obj3 = { name: 'Alice' };

// Check if property exists (doesn't check prototype)
console.log('Has name?', Object.hasOwn(obj3, 'name'));       // true
console.log('Has toString?', Object.hasOwn(obj3, 'toString')); // false

// Older way (still works)
console.log('hasOwnProperty:', obj3.hasOwnProperty('name')); // true

console.log('\n=== 10. Comparing Objects ===');

const a = { x: 1, y: 2 };
const b = { x: 1, y: 2 };

// Reference comparison
console.log('a === b:', a === b); // false (different objects)

// Deep comparison (manual)
function deepEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => obj1[key] === obj2[key]);
}

console.log('Deep equal:', deepEqual(a, b)); // true

console.log('\n=== 11. Transforming Objects ===');

const prices = {
  apple: 1.5,
  banana: 0.5,
  orange: 2.0
};

// Double all prices
const doubled = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [key, value * 2])
);
console.log('Doubled:', doubled);

// Filter expensive items
const expensive = Object.fromEntries(
  Object.entries(prices).filter(([, value]) => value > 1)
);
console.log('Expensive:', expensive);

// Transform keys
const uppercased = Object.fromEntries(
  Object.entries(prices).map(([key, value]) => [key.toUpperCase(), value])
);
console.log('Uppercased keys:', uppercased);

console.log('\n=== 12. Practical Patterns ===');

// Count property occurrences
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' },
  { name: 'Diana', role: 'user' }
];

const roleCounts = users.reduce((acc, user) => {
  acc[user.role] = (acc[user.role] || 0) + 1;
  return acc;
}, {});
console.log('Role counts:', roleCounts); // { admin: 2, user: 2 }

// Invert object (swap keys and values)
const colorCodes = { red: '#FF0000', green: '#00FF00', blue: '#0000FF' };
const codeToColor = Object.fromEntries(
  Object.entries(colorCodes).map(([color, code]) => [code, color])
);
console.log('Inverted:', codeToColor);

// Pick properties
function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter(key => key in obj).map(key => [key, obj[key]])
  );
}

const fullData = { a: 1, b: 2, c: 3, d: 4 };
console.log('Picked:', pick(fullData, ['a', 'c', 'e'])); // { a: 1, c: 3 }

// Omit properties
function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

console.log('Omitted:', omit(fullData, ['b', 'd'])); // { a: 1, c: 3 }

console.log('\n=== Best Practices ===');
console.log('1. Use Object.keys/values/entries for iteration');
console.log('2. Use Object.freeze() for constants');
console.log('3. Use Object.seal() when you need fixed structure');
console.log('4. Remember: freeze and seal are shallow');
console.log('5. Use Object.fromEntries() to transform objects');
console.log('6. Use Object.hasOwn() to check own properties');
console.log('7. Combine Object methods with array methods for transformations');
console.log('8. Be aware that Object.assign() modifies target');
