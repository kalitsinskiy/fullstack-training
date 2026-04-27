// ============================================
// TRUTHY and FALSY Values Examples
// ============================================

console.log('=== 1. The 6 Falsy Values ===');
console.log('JavaScript has ONLY 6 falsy values:');

console.log('\n1. false');
console.log('Boolean(false):', Boolean(false));

console.log('\n2. 0 (zero)');
console.log('Boolean(0):', Boolean(0));

console.log('\n3. "" (empty string)');
console.log('Boolean(""):', Boolean(''));

console.log('\n4. null');
console.log('Boolean(null):', Boolean(null));

console.log('\n5. undefined');
console.log('Boolean(undefined):', Boolean(undefined));

console.log('\n6. NaN');
console.log('Boolean(NaN):', Boolean(NaN));

console.log('\n⚠️ These are the ONLY falsy values in JavaScript!');

console.log('\n=== 2. Everything Else is Truthy ===');

// Truthy values that might surprise you
console.log('\n--- Strings ---');
console.log('Boolean("0"):', Boolean('0'));           // true (not empty!)
console.log('Boolean("false"):', Boolean('false'));   // true (string!)
console.log('Boolean(" "):', Boolean(' '));           // true (whitespace!)

console.log('\n--- Numbers ---');
console.log('Boolean(1):', Boolean(1));               // true
console.log('Boolean(-1):', Boolean(-1));             // true
console.log('Boolean(0.1):', Boolean(0.1));           // true
console.log('Boolean(Infinity):', Boolean(Infinity)); // true

console.log('\n--- Objects and Arrays ---');
console.log('Boolean({}):', Boolean({}));             // true (even empty!)
console.log('Boolean([]):', Boolean([]));             // true (even empty!)
console.log('Boolean(function() {}):', Boolean(function() {})); // true

console.log('\n--- Dates ---');
console.log('Boolean(new Date()):', Boolean(new Date())); // true

console.log('\n=== 3. Truthy/Falsy in Conditions ===');

// if statement
if ('') {
  console.log('This will NOT print');
} else {
  console.log('Empty string is falsy ❌');
}

if ('hello') {
  console.log('Non-empty string is truthy ✅');
}

// Checking for existence
let username = '';
if (username) {
  console.log('Has username');
} else {
  console.log('No username (empty string)');
}

username = 'Alice';
if (username) {
  console.log('Has username:', username);
}

console.log('\n=== 4. Logical Operators with Truthy/Falsy ===');

// && (AND) - returns first falsy or last value
console.log('--- && operator ---');
console.log(true && 'hello');        // "hello"
console.log('hello' && 'world');     // "world"
console.log('hello' && 0);           // 0 (first falsy)
console.log(0 && 'hello');           // 0 (first falsy)
console.log('' && 'hello');          // "" (first falsy)

// || (OR) - returns first truthy or last value
console.log('\n--- || operator ---');
console.log(false || 'hello');       // "hello" (first truthy)
console.log('' || 'default');        // "default"
console.log(0 || 100);               // 100
console.log(null || undefined);      // undefined (last value)
console.log('Alice' || 'Default');   // "Alice" (first truthy)

// Practical use: default values
console.log('\n--- Default values ---');
let count;
let displayCount = count || 0;
console.log('Display count:', displayCount); // 0

let name = '';
let displayName = name || 'Guest';
console.log('Display name:', displayName); // "Guest"

// ⚠️ Gotcha: 0 is falsy!
let price = 0;
let displayPrice = price || 100;
console.log('Display price:', displayPrice); // 100 (not what we want!)

// Solution: use nullish coalescing (??)
displayPrice = price ?? 100;
console.log('Fixed price:', displayPrice); // 0 (correct!)

console.log('\n=== 5. NOT Operator (!) ===');

// Single NOT - converts to opposite boolean
console.log('--- ! operator ---');
console.log(!true);              // false
console.log(!false);             // true
console.log(!'hello');           // false (truthy → false)
console.log(!'');                // true (falsy → true)
console.log(!0);                 // true
console.log(!1);                 // false

// Double NOT - converts to boolean
console.log('\n--- !! operator (convert to boolean) ---');
console.log(!!'hello');          // true
console.log(!!'');               // false
console.log(!!0);                // false
console.log(!!1);                // true
console.log(!!{});               // true
console.log(!![]);               // true
console.log(!!null);             // false

console.log('\n=== 6. Common Patterns ===');

// Check if value exists and is not empty
function hasValue(value) {
  return !!value;
}

console.log('--- hasValue() ---');
console.log('hasValue("hello"):', hasValue('hello'));     // true
console.log('hasValue(""):', hasValue(''));               // false
console.log('hasValue(0):', hasValue(0));                 // false ⚠️
console.log('hasValue(null):', hasValue(null));           // false

// Better check for null/undefined only
function isDefined(value) {
  return value !== null && value !== undefined;
}

console.log('\n--- isDefined() ---');
console.log('isDefined("hello"):', isDefined('hello'));   // true
console.log('isDefined(""):', isDefined(''));             // true ✅
console.log('isDefined(0):', isDefined(0));               // true ✅
console.log('isDefined(null):', isDefined(null));         // false
console.log('isDefined(undefined):', isDefined(undefined)); // false

console.log('\n=== 7. Practical Examples ===');

// Form validation
function validateForm(data) {
  if (!data.username) {
    console.log('❌ Username is required');
    return false;
  }

  if (!data.password) {
    console.log('❌ Password is required');
    return false;
  }

  console.log('✅ Form is valid');
  return true;
}

validateForm({ username: 'Alice', password: '123' });
validateForm({ username: '', password: '123' });

// Array filtering
console.log('\n--- Filter truthy values ---');
const mixed = [0, 1, false, 'hello', '', null, undefined, 'world'];
const truthyOnly = mixed.filter(Boolean); // Boolean as filter function!
console.log('Truthy values:', truthyOnly); // [1, "hello", "world"]

// Conditional rendering (React-style)
function render(condition, content) {
  return condition && content;
}

console.log('\n--- Conditional rendering ---');
console.log(render(true, 'Show this'));     // "Show this"
console.log(render(false, 'Show this'));    // false
console.log(render('', 'Show this'));       // ""
console.log(render(1, 'Show this'));        // "Show this"

console.log('\n=== Best Practices ===');
console.log('1. Remember the 6 falsy values - everything else is truthy');
console.log('2. Be careful with 0, "" and false - they\'re falsy!');
console.log('3. Use Boolean() or !! to explicitly convert to boolean');
console.log('4. Use === null/undefined when you need exact checks');
console.log('5. Use ?? (nullish coalescing) for defaults when 0/"" are valid');
console.log('6. Don\'t compare with true/false: use if (value) not if (value === true)');

// Good vs Bad examples
console.log('\n--- Good vs Bad ---');

const isActive = true;

// ❌ Bad
if (isActive === true) {
  console.log('Bad: unnecessary comparison');
}

// ✅ Good
if (isActive) {
  console.log('Good: direct boolean check');
}

// ❌ Bad
if (Boolean(username) === true) {
  console.log('Bad: overcomplicated');
}

// ✅ Good
if (username) {
  console.log('Good: simple and clear');
}
