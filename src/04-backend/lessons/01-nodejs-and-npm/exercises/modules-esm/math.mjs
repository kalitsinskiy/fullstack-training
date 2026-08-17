// ============================================
// ESM MODULE Exercise — Part 1: Create a module
// ============================================
//
// TODO: Implement and export the following using ES Module syntax:
//
// Named exports:
// 1. add(a, b)       — returns a + b
// 2. subtract(a, b)  — returns a - b
//
// Default export:
// 3. A Calculator class with methods: multiply(a, b) and divide(a, b)
//    - divide should throw Error('Division by zero') if b === 0
//
// Remember:
//   Named:   export const add = (a, b) => ...
//   Default: export default class Calculator { ... }

// Your code here:
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}

export default class Calculator {
  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }

    return a / b;
  }
}
