// ============================================
// CJS MODULE Exercise — Part 1: Create a module
// ============================================
//
// TODO: Implement and export the following functions using module.exports:
//
// 1. add(a, b)       — returns a + b
// 2. subtract(a, b)  — returns a - b
// 3. multiply(a, b)  — returns a * b
// 4. divide(a, b)    — returns a / b, but throws Error('Division by zero') if b === 0
//
// Remember: in CJS you export with `module.exports = { ... }`
// or by assigning to `module.exports.functionName = ...`

// Your code here:
function add(a, b) {
  return a + b;
}
function subtract(a, b) {
  return a - b;
}
function multiply(a, b) {
  return a * b;
}
function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}
module.exports = { add, subtract, multiply, divide };
