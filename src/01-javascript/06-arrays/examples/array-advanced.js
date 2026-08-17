// ============================================
// ARRAY ADVANCED Features Examples
// ============================================

console.log('=== 1. Array Destructuring - Basics ===');

const numbers = [1, 2, 3, 4, 5];

// Extract first elements
const [first, second] = numbers;
console.log('first:', first); // 1
console.log('second:', second); // 2

// Skip elements
const [a, , c] = numbers;
console.log('a:', a); // 1
console.log('c:', c); // 3

// Extract all
const [x, y, z, w, v] = numbers;
console.log('All:', x, y, z, w, v); // 1 2 3 4 5

// More elements than array (undefined)
const [one, two, three, four, five, six] = [1, 2, 3];
console.log('six:', six); // undefined

console.log('\n=== 2. Rest in Destructuring ===');

// Rest operator - collect remaining elements
const [head, ...tail] = numbers;
console.log('head:', head); // 1
console.log('tail:', tail); // [2, 3, 4, 5]

// Get first and last
const [firstNum, ...rest] = numbers;
const lastNum = rest[rest.length - 1];
console.log('First:', firstNum, 'Last:', lastNum);

// Skip and collect
const [, ...withoutFirst] = numbers;
console.log('Without first:', withoutFirst); // [2, 3, 4, 5]

const [f, s, ...remaining] = numbers;
console.log('Remaining:', remaining); // [3, 4, 5]

console.log('\n=== 3. Default Values in Destructuring ===');

const coords = [10];

// With defaults
const [lat = 0, lng = 0] = coords;
console.log('lat:', lat); // 10
console.log('lng:', lng); // 0 (default)

// Works with undefined, not null
const [val1 = 5] = [undefined];
const [val2 = 5] = [null];
console.log('val1:', val1); // 5 (undefined uses default)
console.log('val2:', val2); // null (null doesn't use default!)

console.log('\n=== 4. Swapping Variables ===');

let num1 = 10;
let num2 = 20;

console.log('Before:', num1, num2);

// Swap using destructuring
[num1, num2] = [num2, num1];

console.log('After:', num1, num2);

console.log('\n=== 5. Function Returns with Destructuring ===');

function getCoordinates() {
  return [51.5074, -0.1278];
}

const [latitude, longitude] = getCoordinates();
console.log('Coordinates:', latitude, longitude);

// Ignore some values
function getUserData() {
  return ['Alice', 25, 'alice@example.com'];
}

const [name, , email] = getUserData();
console.log('Name:', name, 'Email:', email);

console.log('\n=== 6. Nested Array Destructuring ===');

const nested = [1, [2, 3], 4];

// Destructure nested array
const [first2, [second2, third2], fourth2] = nested;
console.log(first2, second2, third2, fourth2); // 1 2 3 4

// Deep nesting
const deep1 = [1, [2, [3, [4, 5]]]];
const [n1, [n2, [n3, [n4, n5]]]] = deep1;
console.log(n1, n2, n3, n4, n5); // 1 2 3 4 5

console.log('\n=== 7. Spread Operator - Copying Arrays ===');

const original = [1, 2, 3];

// Shallow copy
const copy = [...original];
copy.push(4);

console.log('Original:', original); // [1, 2, 3]
console.log('Copy:', copy); // [1, 2, 3, 4]

// Alternative ways to copy
const copy2 = original.slice();
const copy3 = Array.from(original);

console.log('All are separate arrays');

console.log('\n=== 8. Spread Operator - Combining Arrays ===');

const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// Combine arrays
const combined = [...arr1, ...arr2];
console.log('Combined:', combined); // [1, 2, 3, 4, 5, 6]

// Insert elements in middle
const withMiddle = [...arr1, 99, ...arr2];
console.log('With middle:', withMiddle); // [1, 2, 3, 99, 4, 5, 6]

// Add to start and end
const wrapped = [0, ...arr1, 7];
console.log('Wrapped:', wrapped); // [0, 1, 2, 3, 7]

console.log('\n=== 9. Spread Operator - Function Arguments ===');

const nums = [5, 10, 15];

// Pass array elements as arguments
console.log('Math.max:', Math.max(...nums)); // 15

function add(a, b, c) {
  return a + b + c;
}

console.log('add(...nums):', add(...nums)); // 30

// Combine with regular arguments
function multiply(x, y, z) {
  return x * y * z;
}

console.log('multiply(2, ...nums):', multiply(2, ...nums.slice(0, 2))); // 100

console.log('\n=== 10. Array.from() ===');

// String to array
const str = 'Hello';
const chars = Array.from(str);
console.log('Chars:', chars); // ['H', 'e', 'l', 'l', 'o']

// Array-like to array
const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
const arr = Array.from(arrayLike);
console.log('From array-like:', arr); // ['a', 'b', 'c']

// With mapping function
const nums2 = Array.from([1, 2, 3], (n) => n * 2);
console.log('With map:', nums2); // [2, 4, 6]

// Create range
const range = Array.from({ length: 5 }, (_, i) => i);
console.log('Range:', range); // [0, 1, 2, 3, 4]

const range2 = Array.from({ length: 5 }, (_, i) => i + 1);
console.log('Range 1-5:', range2); // [1, 2, 3, 4, 5]

console.log('\n=== 11. Array.of() ===');

// Create array from arguments
const arr3 = Array.of(1, 2, 3);
console.log('Array.of(1, 2, 3):', arr3); // [1, 2, 3]

// Difference from Array constructor
console.log('Array(5):', Array(5)); // [ <5 empty items> ]
console.log('Array.of(5):', Array.of(5)); // [5]

console.log('\n=== 12. Flattening Arrays ===');

// flat() - flatten nested arrays
const nested2 = [1, [2, 3], [4, [5, 6]]];

console.log('flat():', nested2.flat()); // [1, 2, 3, 4, [5, 6]]
console.log('flat(2):', nested2.flat(2)); // [1, 2, 3, 4, 5, 6]
console.log('flat(Infinity):', nested2.flat(Infinity)); // Fully flattened

// flatMap() - map then flatten
const words = ['Hello World', 'How are you'];
const allWords = words.flatMap((phrase) => phrase.split(' '));
console.log('flatMap:', allWords); // ['Hello', 'World', 'How', 'are', 'you']

// Same as:
const allWords2 = words.map((phrase) => phrase.split(' ')).flat();
console.log('map + flat:', allWords2);

console.log('\n=== 13. Array Copying - Shallow vs Deep ===');

// Shallow copy - nested arrays/objects still share references
const original2 = [1, 2, [3, 4]];
const shallow = [...original2];

shallow[2][0] = 99; // Modifies nested array

console.log('Original:', original2); // [1, 2, [99, 4]] - changed!
console.log('Shallow:', shallow); // [1, 2, [99, 4]]

// Deep copy - use JSON (works for simple data)
const original3 = [1, 2, [3, 4]];
const deep = JSON.parse(JSON.stringify(original3));

deep[2][0] = 99;

console.log('Original3:', original3); // [1, 2, [3, 4]] - unchanged
console.log('Deep:', deep); // [1, 2, [99, 4]]

// Deep copy with structuredClone (modern)
const original4 = [1, 2, [3, 4]];
const deep2 = structuredClone(original4);

deep2[2][0] = 99;

console.log('Original4:', original4); // [1, 2, [3, 4]] - unchanged
console.log('Deep2:', deep2); // [1, 2, [99, 4]]

console.log('\n=== 14. Immutable Operations ===');

// Instead of mutating, create new arrays
const items = [1, 2, 3, 4, 5];

// ❌ Mutating
// items.push(6);

// ✅ Immutable
const withAdded = [...items, 6];
console.log('With added:', withAdded);

// Remove element immutably
const withoutThird = [...items.slice(0, 2), ...items.slice(3)];
console.log('Without third:', withoutThird); // [1, 2, 4, 5]

// Or using filter
const without3 = items.filter((_, i) => i !== 2);
console.log('Without index 2:', without3);

// Update element immutably
const withUpdated = [...items.slice(0, 2), 99, ...items.slice(3)];
console.log('With updated:', withUpdated); // [1, 2, 99, 4, 5]

// Or using map
const withUpdated2 = items.map((n, i) => (i === 2 ? 99 : n));
console.log('With updated (map):', withUpdated2);

console.log('\n=== 15. Advanced Patterns ===');

// Remove duplicates
const withDups = [1, 2, 2, 3, 3, 3, 4, 4, 5];
const unique = [...new Set(withDups)];
console.log('Unique:', unique); // [1, 2, 3, 4, 5]

// Intersection (common elements)
const set1 = [1, 2, 3, 4, 5];
const set2 = [3, 4, 5, 6, 7];
const intersection = set1.filter((n) => set2.includes(n));
console.log('Intersection:', intersection); // [3, 4, 5]

// Union (all unique elements)
const union = [...new Set([...set1, ...set2])];
console.log('Union:', union); // [1, 2, 3, 4, 5, 6, 7]

// Difference (in set1 but not in set2)
const difference = set1.filter((n) => !set2.includes(n));
console.log('Difference:', difference); // [1, 2]

// Zip two arrays
const names = ['Alice', 'Bob', 'Charlie'];
const ages = [25, 30, 35];
const zipped = names.map((name, i) => [name, ages[i]]);
console.log('Zipped:', zipped); // [['Alice', 25], ['Bob', 30], ['Charlie', 35]]

// Transpose (flip rows and columns)
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
];
const transposed = matrix[0].map((_, i) => matrix.map((row) => row[i]));
console.log('Transposed:', transposed); // [[1, 4], [2, 5], [3, 6]]

// Partition array
const mixed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const [evens, odds] = mixed.reduce(
  ([evens, odds], n) => (n % 2 === 0 ? [[...evens, n], odds] : [evens, [...odds, n]]),
  [[], []]
);
console.log('Evens:', evens);
console.log('Odds:', odds);

console.log('\n=== 16. Practical Examples ===');

// Paginate array
function paginate(array, pageSize) {
  return array.reduce((pages, item, index) => {
    const pageIndex = Math.floor(index / pageSize);
    if (!pages[pageIndex]) {
      pages[pageIndex] = [];
    }
    pages[pageIndex].push(item);
    return pages;
  }, []);
}

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pages = paginate(data, 3);
console.log('Pages:', pages); // [[1,2,3], [4,5,6], [7,8,9], [10]]

// Shuffle array
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

console.log('Shuffled:', shuffle([1, 2, 3, 4, 5]));

console.log('\n=== Best Practices ===');
console.log('1. Use destructuring for cleaner code');
console.log('2. Use spread operator to copy/combine arrays');
console.log('3. Prefer immutable operations (create new arrays)');
console.log('4. Use Array.from() to convert array-like objects');
console.log('5. Use Set for unique values');
console.log('6. Be aware of shallow vs deep copy');
console.log('7. Use flat() to flatten nested arrays');
console.log('8. Use flatMap() instead of map().flat()');
