// ============================================
// OBJECT BASICS Examples
// ============================================

console.log('=== 1. Creating Objects ===');

// Object literal (most common)
const person = {
  name: 'Alice',
  age: 25,
  city: 'London',
};
console.log('Person:', person);

// Empty object
const empty = {};
console.log('Empty:', empty);

// Object constructor (rarely used)
const obj = new Object();
obj.name = 'Bob';
console.log('With constructor:', obj);

// Properties can be any valid identifier
const user = {
  firstName: 'Charlie',
  last_name: 'Brown',
  age2: 30,
  $special: true,
};
console.log('User:', user);

console.log('\n=== 2. Property Access ===');

const car = {
  brand: 'Toyota',
  model: 'Camry',
  year: 2024,
};

// Dot notation
console.log('Brand:', car.brand);
console.log('Model:', car.model);

// Bracket notation
console.log('Year:', car['year']);

// Variables in bracket notation
const prop = 'model';
console.log('Dynamic access:', car[prop]);

// Must use brackets for:
// - Properties with spaces
const data = {
  'first name': 'Alice',
  'user-age': 25,
};
console.log(data['first name']);
console.log(data['user-age']);

// - Dynamic property names
const key = 'brand';
console.log('Dynamic:', car[key]);

// - Property names that are numbers
const nums = {
  1: 'one',
  2: 'two',
};
console.log(nums[1]); // Must use brackets
// console.log(nums.1); // ❌ Syntax error

console.log('\n=== 3. Adding and Modifying Properties ===');

const product = {
  name: 'Laptop',
  price: 1000,
};

// Add new property
product.brand = 'Dell';
product['warranty'] = '2 years';
console.log('After adding:', product);

// Modify existing property
product.price = 900;
product['name'] = 'Gaming Laptop';
console.log('After modifying:', product);

// Properties can be added at any time
product.inStock = true;
console.log('With stock:', product);

console.log('\n=== 4. Deleting Properties ===');

const student = {
  name: 'Alice',
  age: 20,
  grade: 'A',
  temp: 'to be deleted',
};

// Delete property
delete student.temp;
console.log('After delete:', student);

// Delete returns true if successful
const deleted = delete student.grade;
console.log('Deleted?', deleted); // true
console.log('After deleting grade:', student);

// Can't delete inherited properties
delete student.toString; // Returns true but doesn't actually delete
console.log('Has toString?', student.toString !== undefined); // true

console.log('\n=== 5. Property Shorthand ===');

const name = 'Bob';
const age = 30;

// Old way
const person1 = {
  name: name,
  age: age,
};

// Shorthand (when variable name matches property name)
const person2 = {
  name,
  age,
};

console.log('Person 1:', person1);
console.log('Person 2:', person2);

console.log('\n=== 6. Computed Property Names ===');

// Use expression as property name
const propName = 'score';
const game = {
  [propName]: 100,
  ['level' + '1']: 'Easy',
  [2 + 3]: 'Five',
};

console.log('Game:', game); // { score: 100, level1: 'Easy', 5: 'Five' }

// Dynamic property names
function createUser(name, role) {
  return {
    name,
    [role]: true, // role value becomes property name
  };
}

console.log(createUser('Alice', 'admin')); // { name: 'Alice', admin: true }
console.log(createUser('Bob', 'user')); // { name: 'Bob', user: true }

console.log('\n=== 7. Nested Objects ===');

const company = {
  name: 'Tech Corp',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
  },
  employees: [
    { name: 'Alice', role: 'Developer' },
    { name: 'Bob', role: 'Designer' },
  ],
};

// Access nested properties
console.log('City:', company.address.city);
console.log('First employee:', company.employees[0].name);

// Modify nested properties
company.address.street = '456 Oak Ave';
company.employees[0].role = 'Senior Developer';
console.log('Updated company:', company);

console.log('\n=== 8. Checking if Property Exists ===');

const book = {
  title: 'JavaScript Guide',
  author: 'John Doe',
  pages: 300,
};

// in operator
console.log('Has title?', 'title' in book); // true
console.log('Has publisher?', 'publisher' in book); // false

// hasOwnProperty method (doesn't check prototype chain)
console.log('Has author?', book.hasOwnProperty('author')); // true
console.log('Has toString?', book.hasOwnProperty('toString')); // false

// Check for undefined (not reliable if property is actually undefined)
console.log('title exists?', book.title !== undefined); // true
console.log('publisher exists?', book.publisher !== undefined); // false

// Optional chaining (safe nested access)
console.log('Reviews count:', book.reviews?.count); // undefined (no error)

console.log('\n=== 9. Reference vs Value ===');

// Objects are reference types
const obj1 = { x: 10 };
const obj2 = obj1; // Same reference!

obj2.x = 20;
console.log('obj1.x:', obj1.x); // 20 - also changed!
console.log('obj2.x:', obj2.x); // 20

// Compare references, not values
const a = { x: 1 };
const b = { x: 1 };
console.log('a === b:', a === b); // false (different objects)
console.log('a === a:', a === a); // true (same reference)

console.log('\n=== 10. Copying Objects ===');

const original = { x: 1, y: 2 };

// Shallow copy with spread
const copy1 = { ...original };
copy1.x = 99;
console.log('Original:', original); // { x: 1, y: 2 } - unchanged
console.log('Copy:', copy1); // { x: 99, y: 2 }

// Shallow copy with Object.assign
const copy2 = Object.assign({}, original);
console.log('Copy2:', copy2);

// Problem with nested objects (shallow copy)
const nested = {
  name: 'Alice',
  address: { city: 'London' },
};

const shallowCopy = { ...nested };
shallowCopy.address.city = 'Paris'; // Modifies nested object!

console.log('Original nested:', nested.address.city); // 'Paris' - changed!
console.log('Copy nested:', shallowCopy.address.city); // 'Paris'

console.log('\n=== 11. Property Enumeration ===');

const colors = {
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
};

// for...in loop
console.log('Using for...in:');
for (const key in colors) {
  console.log(`${key}: ${colors[key]}`);
}

// Object.keys()
console.log('Keys:', Object.keys(colors));

// Object.values()
console.log('Values:', Object.values(colors));

// Object.entries()
console.log('Entries:', Object.entries(colors));

console.log('\n=== 12. Property Descriptors ===');

// Properties have hidden attributes
const point = { x: 10, y: 20 };

// Get property descriptor
const descriptor = Object.getOwnPropertyDescriptor(point, 'x');
console.log('Descriptor:', descriptor);
// { value: 10, writable: true, enumerable: true, configurable: true }

// Define property with custom attributes
Object.defineProperty(point, 'z', {
  value: 30,
  writable: false, // Cannot be changed
  enumerable: true, // Shows in for...in
  configurable: false, // Cannot be deleted or reconfigured
});

console.log('point.z:', point.z);
// point.z = 999; // Fails silently (or throws in strict mode)
console.log('After attempt to change:', point.z); // Still 30

console.log('\n=== Best Practices ===');
console.log('1. Use object literals {} for creating objects');
const myCar = { make: 'Honda', model: 'Civic' };
console.log('2. Use dot notation when possible (more readable)');
console.log('My car:', myCar.make, myCar.model);
console.log('3. Use bracket notation for dynamic properties');
const prop1 = 'model';
console.log('Dynamic access:', myCar[prop1]);
const prop2 = 'make';
console.log('Dynamic access:', myCar[prop2]);
console.log('4. Use const for objects (prevents reassignment, not mutation)');

console.log('5. Use property shorthand for cleaner code');
const name = 'Alice';
const age = 30;
const user1 = { name: name, age: age }; // Old way
const user2 = { name, age }; // Shorthand
console.log('User1:', user1);
console.log('User2:', user2);
console.log('6. Be aware of reference behavior');
const objA = { value: 1 };
const objB = objA; // Same reference
objB.value = 99;
console.log('objA.value:', objA.value); // 99 - changed through objB
console.log('7. Use optional chaining (?.) for safe nested access');
const data = { user: { name: 'Alice', address: { city: 'London' } } };
console.log('City:', data.user?.address?.city);
console.log('8. Remember: objects are mutable even with const');
