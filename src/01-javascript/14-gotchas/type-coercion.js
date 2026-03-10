// ============================================
// TYPE SYSTEM GOTCHAS
// ============================================

console.log('=== typeof null === "object" ===');

console.log(typeof null);            // 'object' ← historical bug, never fixed
console.log(null instanceof Object); // false    ← contradicts typeof!

// Correct null check — always use ===
const val = null;
console.log(val === null);           // ✅

// ---
console.log('\n=== typeof NaN === "number" ===');

console.log(typeof NaN);      // 'number' ← "Not a Number" is a number type
console.log(NaN === NaN);     // false   ← only value not equal to itself
console.log(NaN !== NaN);     // true

// ❌ Wrong ways to check NaN:
console.log(NaN == NaN);              // false
console.log(typeof x === 'NaN');      // always false (no such type)

// ✅ Correct:
console.log(Number.isNaN(NaN));       // true
console.log(Number.isNaN('hello'));   // false — it's not even numeric

// ⚠️ Trap: global isNaN() converts first
console.log(isNaN('hello'));          // true  ← 'hello' → NaN, then NaN check
console.log(Number.isNaN('hello'));   // false ← no conversion, string ≠ NaN

// ---
console.log('\n=== Array sort() without comparator ===');

// Default sort compares as STRINGS (lexicographic)
console.log([1, 10, 2, 21, 3].sort());
// [1, 10, 2, 21, 3]  ← '10' < '2' because '1' < '2'

// ✅ Always pass comparator for numbers:
console.log([1, 10, 2, 21, 3].sort((a, b) => a - b));
// [1, 2, 3, 10, 21] ✅

// Strings sort correctly though:
console.log(['banana', 'apple', 'cherry'].sort());
// ['apple', 'banana', 'cherry'] ✅

// ---
console.log('\n=== + operator coercion ===');

console.log(1 + '2');       // '12'  — number becomes string (+ is ambiguous)
console.log('3' - 1);       // 2     — string becomes number (- is unambiguous)
console.log('3' * '2');     // 6     — both become numbers
console.log(true + true);   // 2     — true → 1
console.log(true + false);  // 1
console.log(null + 1);      // 1     — null → 0
console.log(undefined + 1); // NaN   — undefined → NaN

console.log(+[]);           // 0     — [] → '' → 0
console.log(+{});           // NaN   — {} → '[object Object]' → NaN
console.log([] + []);       // ''    — '' + ''
console.log([] + {});       // '[object Object]'
console.log({} + []);       // '[object Object]' (as expression)
                             // but `{} + []` at line start → 0 (braces = block!)

// ---
console.log('\n=== parseInt surprises ===');

console.log(parseInt('10.9'));    // 10    — stops at non-integer char
console.log(parseInt('10abc'));   // 10    — stops at first non-digit
console.log(parseInt('abc10'));   // NaN   — can't start with letters
console.log(parseInt('0x1F'));    // 31    — recognizes hex prefix
console.log(parseInt('010'));     // 10    — was 8 (octal) in old engines!

// ✅ Always pass radix to be safe:
console.log(parseInt('10', 10));  // 10 decimal
console.log(parseInt('10', 2));   // 2  binary
console.log(parseInt('ff', 16));  // 255 hex

// ⚠️ Famous trap: using parseInt as a map callback
console.log(['1', '2', '3'].map(parseInt));
// [1, NaN, NaN] ← map passes (value, index, array) but parseInt takes (string, radix)
// parseInt('1', 0) = 1, parseInt('2', 1) = NaN, parseInt('3', 2) = NaN

// ✅ Fix:
console.log(['1', '2', '3'].map(Number));   // [1, 2, 3]
console.log(['1', '2', '3'].map(n => parseInt(n, 10))); // [1, 2, 3]

// ---
console.log('\n=== Array constructor trap ===');

console.log(Array(3));       // [ <3 empty items> ] — sparse array, NOT [3]
console.log(Array(3).length); // 3
console.log([1, 2, 3]); // [1, 2, 3] — 2+ args = elements

console.log(Array.of(3));    // [3]        ✅ always creates array with these elements
console.log(Array.of(1, 2, 3)); // [1, 2, 3]

console.log(new Array(3).fill(0)); // [0, 0, 0] — common workaround

// ---
console.log('\n=== 0.1 + 0.2 ===');

console.log(0.1 + 0.2);           // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);   // false

// ✅ Use epsilon comparison for floats:
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true
// Or round:
console.log(+(0.1 + 0.2).toFixed(1));  // 0.3
