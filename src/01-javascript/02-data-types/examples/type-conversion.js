// ============================================
// TYPE CONVERSION Examples
// ============================================

console.log('=== 1. Explicit Conversion (Manual) ===');

// To String
console.log('--- String() ---');
console.log(String(123));        // "123"
console.log(String(true));       // "true"
console.log(String(null));       // "null"
console.log(String(undefined));  // "undefined"

// Alternative: toString()
console.log((123).toString());   // "123"
console.log(true.toString());    // "true"

// To Number
console.log('\n--- Number() ---');
console.log(Number('123'));      // 123
console.log(Number('12.5'));     // 12.5
console.log(Number(''));         // 0 (empty string)
console.log(Number(' '));        // 0 (whitespace)
console.log(Number('hello'));    // NaN
console.log(Number(true));       // 1
console.log(Number(false));      // 0
console.log(Number(null));       // 0
console.log(Number(undefined));  // NaN

// Alternative: parseInt(), parseFloat()
console.log('\n--- parseInt(), parseFloat() ---');
console.log(parseInt('42'));        // 42
console.log(parseInt('42.8'));      // 42 (ignores decimals)
console.log(parseFloat('42.8'));    // 42.8
console.log(parseInt('42px'));      // 42 (stops at non-digit)
console.log(parseInt('px42'));      // NaN (must start with digit)

// To Boolean
console.log('\n--- Boolean() ---');
console.log(Boolean(1));            // true
console.log(Boolean(0));            // false
console.log(Boolean('hello'));      // true
console.log(Boolean(''));           // false
console.log(Boolean(null));         // false
console.log(Boolean(undefined));    // false
console.log(Boolean({}));           // true
console.log(Boolean([]));           // true

console.log('\n=== 2. Implicit Conversion (Automatic) ===');

// String concatenation
console.log('--- With + operator ---');
console.log('5' + 3);          // "53" (number → string)
console.log('Hello' + true);   // "Hellotrue"
console.log('Result: ' + 42);  // "Result: 42"
console.log(1 + 2 + '3');      // "33" (1+2=3, then 3+"3")
console.log('3' + 1 + 2);      // "312" (left to right)

// Numeric conversion
console.log('\n--- With arithmetic operators ---');
console.log('5' - 3);          // 2 (string → number)
console.log('10' * '2');       // 20
console.log('20' / '4');       // 5
console.log('5' - 'x');        // NaN (can't convert "x")

// Unary plus
console.log('\n--- Unary + ---');
console.log(+'42');            // 42 (string → number)
console.log(+true);            // 1
console.log(+false);           // 0
console.log(+'');              // 0

// Boolean context
console.log('\n--- In conditions ---');
if ('hello') {
  console.log('Non-empty string is truthy');
}

if (0) {
  console.log('This will not print');
} else {
  console.log('0 is falsy');
}

console.log('\n=== 3. Comparison Coercion ===');

// Loose equality (==) - performs type coercion
console.log('--- == (loose equality) ---');
console.log(5 == '5');         // true (string → number)
console.log(true == 1);        // true
console.log(false == 0);       // true
console.log(null == undefined); // true
console.log('' == 0);          // true

// Strict equality (===) - no type coercion
console.log('\n--- === (strict equality) ---');
console.log(5 === '5');        // false (different types)
console.log(true === 1);       // false
console.log(null === undefined); // false
console.log('' === 0);         // false

console.log('\n=== 4. Common Gotchas ===');

// Array to string
console.log('--- Arrays ---');
console.log([1, 2, 3] + [4, 5]); // "1,2,34,5" (both → strings)
console.log([] + []);            // "" (empty string)
console.log([] + {});            // "[object Object]"

// Object to primitive
console.log('\n--- Objects ---');
console.log({} + []);            // Depends on context
console.log(String({}));         // "[object Object]"

// null vs undefined
console.log('\n--- null vs undefined ---');
console.log(null + 5);           // 5 (null → 0)
console.log(undefined + 5);      // NaN (undefined → NaN)

// Multiple operations
console.log('\n--- Operation chains ---');
console.log('5' - - '3');        // 8 (double negative)
console.log('5' - + '3');        // 2
console.log(true + true);        // 2 (1 + 1)
console.log(true + false);       // 1 (1 + 0)

console.log('\n=== 5. Best Practices ===');
console.log('✅ Use explicit conversion when possible');
console.log('   const num = Number(str); // Clear intent');

console.log('\n✅ Use === instead of ==');
console.log('   if (x === 5) // No surprises');

console.log('\n✅ Be careful with + operator');
console.log('   Use it for addition OR concatenation, not both');

console.log('\n❌ Avoid relying on implicit conversion');
console.log('   It can lead to unexpected bugs');

// Good practice example
const userInput = '42';
const numberValue = Number(userInput); // Explicit
if (numberValue === 42) { // Strict equality
  console.log('\n✅ Clean, predictable code');
}
