// ============================================
// ERROR HANDLING Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/08-error-handling/exercises/error-handling.js

console.log('=== Exercise 1: Basic try...catch ===');
// TODO: Wrap this code in try...catch and log the error message
// const result = null.toString();
// Your code here:
try {
  const result = null.toString();
} catch (error) {
  console.log('Caught error:', error.message);
}

console.log('\n=== Exercise 2: finally block ===');
// TODO: Create a function that "reads a file" (simulated)
// Use finally to log "File operation complete" whether it succeeds or fails
function readFile(filename) {
  // Simulate: if filename is 'error.txt', throw Error('File not found')
  // otherwise return 'file contents'
  // Your code here:
  try {
    if (filename === 'error.txt') {
      throw new Error('File not found');
    }
    return 'file contents';
  } catch (error) {
    console.log('Error reading file:', error.message);
  } finally {
    console.log('File operation complete');
  }
}
readFile('data.txt');
readFile('error.txt');

console.log('\n=== Exercise 3: Throw custom message ===');
// TODO: Complete the function - throw an appropriate error if age is invalid
function validateAge(age) {
  // Throw TypeError if age is not a number
  // Throw RangeError if age is < 0 or > 150
  // Otherwise return age
  if (typeof age !== 'number') {
    throw new TypeError('Age must be a number');
  }
  if (age < 0 || age > 150) {
    throw new RangeError('Age must be between 0 and 150');
  }
  return age;
}

try {
  console.log(validateAge(25)); // 25
} catch (error) {
  console.log(error.name + ':', error.message);
}

try {
  console.log(validateAge(-1)); // RangeError
} catch (error) {
  console.log(error.name + ':', error.message);
}

try {
  console.log(validateAge('old')); // TypeError
} catch (error) {
  console.log(error.name + ':', error.message);
}

console.log('\n=== Exercise 4: JSON parsing ===');
// TODO: Create a safe JSON parser that returns null on error instead of throwing
function safeParse(jsonString) {
  // Your code here
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log('JSON parse error:', error.message);
    return null;
  }
}
console.log(safeParse('{"name": "Alice"}')); // { name: 'Alice' }
console.log(safeParse('{invalid}')); // null

console.log('\n=== Exercise 5: Custom error class ===');
// TODO: Create a NotFoundError class that extends Error
// It should have: name, message, resource, id properties
class NotFoundError extends Error {
  // Your code here
  constructor(resource, id) {
    super(`${resource} with ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
try {
  throw new NotFoundError('User', 42);
} catch (error) {
  console.log(error.name); // 'NotFoundError'
  console.log(error.message); // 'User with id 42 not found'
  console.log(error.resource); // 'User'
  console.log(error.id); // 42
}

console.log('\n=== Exercise 6: instanceof check ===');
// TODO: Create handleError() that handles different error types differently
function handleError(error) {
  // If NotFoundError → log "Resource not found: [message]"'
  if (error instanceof NotFoundError) {
    console.log('Resource not found: ' + error.message);
  }
  // If TypeError → log "Type error: [message]"
  else if (error instanceof TypeError) {
    console.log('Type error: ' + error.message);
  }
  // Otherwise → log "Unknown error: [message]" and re-throw
  else {
    console.log('Unknown error: ' + error.message);
    throw error;
  }
}
handleError(new NotFoundError('Product', 99));
handleError(new TypeError('Not a function'));

console.log('\n=== Exercise 7: Error propagation ===');
// TODO: Create a chain of functions where the error from step3 propagates to main
// Only main() should catch it and log where it came from
function step3() {
  throw new Error('Database connection failed');
}
function step2() {
  // call step3() - don't catch, let error propagate
  step3();
}
function step1() {
  // call step2() - don't catch, let error propagate
  step2();
}

try {
  step1();
} catch (error) {
  console.log('Caught in main:', error.message);
}

console.log('\n=== 🎯 Challenge: Retry with error ===');
// TODO: Create a retry function that re-runs fn up to maxRetries times
// Throw the last error if all retries fail
function retry(fn, maxRetries) {
  let lastError;
  for (let i = 1; i < maxRetries; i++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i} failed with ${error.message}`);
    }
  }
  throw lastError;
}

// Test it:
let attempt = 0;
try {
  retry(() => {
    attempt++;
    if (attempt < 3) throw new Error(`Attempt ${attempt} failed`);
    return 'success';
  }, 5);
  console.log('Succeeded on attempt:', attempt);
} catch (error) {
  console.log('All retries failed');
}

console.log('\n=== 🎯 Challenge: Validation with multiple errors ===');
// TODO: Create a function that validates a user object
// Collect ALL validation errors (not just the first one)
// Throw a single error with all messages
class UserValidationError extends Error {
  constructor(errors) {
    super('User validation failed');
    this.name = 'UserValidationError';
    this.errors = errors;
  }

  getFieldErrors() {
    return this.errors.map((e) => e.message);
  }
}

function validateUser(user) {
  const errors = [];

  // Validate: name (string, >= 2 chars), age (number, 0-120), email (has @)
  // Collect all errors, then throw if any
  if (typeof user.name !== 'string' || user.name.length < 3) {
    errors.push({ field: 'name', message: 'Name must be at least 3 characters' });
  }

  if (typeof user.age !== 'number' || user.age < 0 || user.age > 120) {
    errors.push({ field: 'age', message: 'Age must be with (number, 0-120)' });
  }

  if (typeof user.email !== 'string' || !user.email.includes('@')) {
    errors.push({ field: 'email', message: 'Email must be with @' });
  }

  if (errors.length) {
    throw new UserValidationError(errors);
  }

  return true;
}

try {
  validateUser({ name: 'A', age: -5, email: 'notanemail' });
} catch (error) {
  console.log(error.message);
  if (error instanceof UserValidationError) {
    console.log(error.getFieldErrors().join('; '));
  }
}

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
