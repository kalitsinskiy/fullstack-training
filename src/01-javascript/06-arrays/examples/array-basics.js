// ============================================
// ARRAY BASICS Examples
// ============================================

console.log('=== 1. Creating Arrays ===');

// Array literal (most common)
const fruits = ['apple', 'banana', 'orange'];
console.log('Fruits:', fruits);

// Array constructor
const numbers = [1, 2, 3, 4, 5];
console.log('Numbers:', numbers);

// Create empty array of specific length
const empty = new Array(5);
console.log('Empty array:', empty); // [ <5 empty items> ]
console.log('Length:', empty.length); // 5

// Mixed types (possible but not recommended)
const mixed = [1, 'two', true, null, { x: 5 }, [1, 2]];
console.log('Mixed:', mixed);

console.log('\n=== 2. Accessing Elements ===');

const colors = ['red', 'green', 'blue', 'yellow'];

// By index (zero-based)
console.log('First:', colors[0]);     // 'red'
console.log('Second:', colors[1]);    // 'green'
console.log('Last:', colors[colors.length - 1]); // 'yellow'

// at() method (supports negative indices)
console.log('Last with at():', colors.at(-1));   // 'yellow'
console.log('Second to last:', colors.at(-2));   // 'blue'

// Out of bounds
console.log('Index 10:', colors[10]); // undefined

console.log('\n=== 3. Array Properties ===');

const animals = ['cat', 'dog', 'bird'];

console.log('Length:', animals.length); // 3
console.log('Is array?', Array.isArray(animals)); // true
console.log('Is array (object)?', Array.isArray({})); // false

// Length is writable!
animals.length = 2;
console.log('After length = 2:', animals); // ['cat', 'dog']

animals.length = 5;
console.log('After length = 5:', animals); // ['cat', 'dog', <3 empty items>]

console.log('\n=== 4. Adding Elements ===');

const nums = [1, 2, 3];

// push - add to end (returns new length)
const newLength = nums.push(4, 5);
console.log('After push:', nums);        // [1, 2, 3, 4, 5]
console.log('New length:', newLength);   // 5

// unshift - add to beginning (returns new length)
nums.unshift(0);
console.log('After unshift:', nums);     // [0, 1, 2, 3, 4, 5]

// Direct assignment
nums[6] = 6;
console.log('After nums[6] = 6:', nums); // [0, 1, 2, 3, 4, 5, 6]

// Sparse array (not recommended)
nums[10] = 10;
console.log('Sparse array:', nums);      // [0, 1, 2, 3, 4, 5, 6, <3 empty>, 10]

console.log('\n=== 5. Removing Elements ===');

const letters = ['a', 'b', 'c', 'd', 'e'];

// pop - remove last element (returns removed element)
const removed = letters.pop();
console.log('Popped:', removed);         // 'e'
console.log('After pop:', letters);      // ['a', 'b', 'c', 'd']

// shift - remove first element (returns removed element)
const first = letters.shift();
console.log('Shifted:', first);          // 'a'
console.log('After shift:', letters);    // ['b', 'c', 'd']

// delete - creates "hole" (not recommended)
delete letters[1];
console.log('After delete:', letters);   // ['b', <1 empty>, 'd']
console.log('Length:', letters.length);  // 3 (length unchanged!)

console.log('\n=== 6. Modifying Elements ===');

const values = [10, 20, 30, 40, 50];

// Direct assignment
values[0] = 100;
console.log('Changed first:', values);   // [100, 20, 30, 40, 50]

// splice - add/remove elements at any position
// splice(start, deleteCount, ...items)
const original = [1, 2, 3, 4, 5];

// Remove 2 elements starting at index 1
const spliced = [...original];
spliced.splice(1, 2);
console.log('After splice(1, 2):', spliced); // [1, 4, 5]

// Replace element at index 2
const spliced2 = [...original];
spliced2.splice(2, 1, 99);
console.log('After splice(2, 1, 99):', spliced2); // [1, 2, 99, 4, 5]

// Insert without removing
const spliced3 = [...original];
spliced3.splice(2, 0, 'a', 'b');
console.log('After splice(2, 0, "a", "b"):', spliced3); // [1, 2, 'a', 'b', 3, 4, 5]

console.log('\n=== 7. Searching Elements ===');

const items = ['apple', 'banana', 'orange', 'banana'];

// indexOf - first index of element (-1 if not found)
console.log('indexOf("banana"):', items.indexOf('banana'));      // 1
console.log('indexOf("grape"):', items.indexOf('grape'));        // -1

// lastIndexOf - last index of element
console.log('lastIndexOf("banana"):', items.lastIndexOf('banana')); // 3

// includes - check if element exists
console.log('includes("orange"):', items.includes('orange'));    // true
console.log('includes("grape"):', items.includes('grape'));      // false

console.log('\n=== 8. Extracting Subarrays ===');

const sequence = [0, 1, 2, 3, 4, 5];

// slice(start, end) - extract portion (non-mutating)
console.log('slice(2, 4):', sequence.slice(2, 4));     // [2, 3]
console.log('slice(2):', sequence.slice(2));           // [2, 3, 4, 5]
console.log('slice(-2):', sequence.slice(-2));         // [4, 5]
console.log('Original:', sequence);                    // Unchanged

// Copy entire array
const copy = sequence.slice();
console.log('Copy:', copy);

console.log('\n=== 9. Combining Arrays ===');

const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// concat - combine arrays (non-mutating)
const combined = arr1.concat(arr2);
console.log('Combined:', combined);      // [1, 2, 3, 4, 5, 6]
console.log('arr1 unchanged:', arr1);    // [1, 2, 3]

// concat with multiple arrays
const arr3 = [7, 8];
const combined2 = arr1.concat(arr2, arr3);
console.log('Multiple concat:', combined2); // [1, 2, 3, 4, 5, 6, 7, 8]

// concat with individual elements
const combined3 = arr1.concat(99, arr2);
console.log('With element:', combined3); // [1, 2, 3, 99, 4, 5, 6]

console.log('\n=== 10. Converting Arrays ===');

const words = ['Hello', 'World', 'JavaScript'];

// join - array to string
console.log('join():', words.join());         // "Hello,World,JavaScript"
console.log('join(" "):', words.join(' '));   // "Hello World JavaScript"
console.log('join("-"):', words.join('-'));   // "Hello-World-JavaScript"

// toString - array to string
console.log('toString():', words.toString()); // "Hello,World,JavaScript"

// String to array
const str = 'Hello';
const chars = str.split('');
console.log('split(""):', chars);             // ['H', 'e', 'l', 'l', 'o']

const sentence = 'Hello World JavaScript';
const wordArray = sentence.split(' ');
console.log('split(" "):', wordArray);        // ['Hello', 'World', 'JavaScript']

console.log('\n=== 11. Sorting Arrays ===');

const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];

// sort - mutates original (alphabetical by default)
const toSort = [...unsorted];
toSort.sort();
console.log('Sorted (default):', toSort);    // [1, 1, 2, 3, 4, 5, 6, 9]

// Sort numbers properly
const numSort = [...unsorted];
numSort.sort((a, b) => a - b);
console.log('Sorted (numeric):', numSort);   // [1, 1, 2, 3, 4, 5, 6, 9]

// Descending
const descSort = [...unsorted];
descSort.sort((a, b) => b - a);
console.log('Sorted (descending):', descSort); // [9, 6, 5, 4, 3, 2, 1, 1]

// reverse - mutates original
const toReverse = [1, 2, 3, 4, 5];
toReverse.reverse();
console.log('Reversed:', toReverse);         // [5, 4, 3, 2, 1]

console.log('\n=== 12. Reference vs Value ===');

// Arrays are reference types
const a = [1, 2, 3];
const b = a;  // Same reference!

b.push(4);
console.log('a:', a);  // [1, 2, 3, 4] - also changed!
console.log('b:', b);  // [1, 2, 3, 4]

// Create separate copy
const c = [1, 2, 3];
const d = [...c];  // Different reference

d.push(4);
console.log('c:', c);  // [1, 2, 3] - unchanged
console.log('d:', d);  // [1, 2, 3, 4]

console.log('\n=== Best Practices ===');
console.log('1. Use array literals [] instead of new Array()');
console.log('2. Use push/pop for end, unshift/shift for beginning');
console.log('3. Use slice() to copy arrays');
console.log('4. Avoid delete - use splice instead');
console.log('5. Use Array.isArray() to check if value is array');
console.log('6. Remember: sort() mutates original array');
console.log('7. Provide compare function to sort() for numbers');
