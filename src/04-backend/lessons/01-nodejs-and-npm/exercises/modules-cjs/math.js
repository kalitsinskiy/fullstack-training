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
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
};
