// ============================================
// ERROR HANDLING Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/08-error-handling/exercises/error-handling.js

console.log('=== Exercise 1: Basic try...catch ===');
// TODO: Wrap this code in try...catch and log the error message
// const result = null.toString();
// Your code here:
try{
  const result = null.toString();
}
catch(error) {
  console.error(`Error encountered: ${error.message}`);
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
      throw Error('File not found');
    }
      return 'file contents';
  }
  catch(error) {
    console.error(`readFile function encountered an error: ${error.message}`);
  }
  finally {
    console.info('readFile function completed');
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
    throw new TypeError('age must be a number');
  }

  if (age < 0 || age > 150) {
    throw new RangeError('age must be in [0:150] range');
  }

  return age;
}
console.log(validateAge(25));   // 25
//console.log(validateAge(-1));   // RangeError
//console.log(validateAge('old')); // TypeError


console.log('\n=== Exercise 4: JSON parsing ===');
// TODO: Create a safe JSON parser that returns null on error instead of throwing
function safeParse(jsonString) {
  // Your code here
  try {
    return JSON.parse(jsonString);
  }
  catch(error){
    console.error('Could not parse JSON');
    return null;
  }
}
console.log(safeParse('{"name": "Alice"}')); // { name: 'Alice' }
console.log(safeParse('{invalid}'));          // null


console.log('\n=== Exercise 5: Custom error class ===');
// TODO: Create a NotFoundError class that extends Error
// It should have: name, message, resource, id properties
class NotFoundError extends Error {
  // Your code here
  constructor(resource, id){
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
try {
  throw new NotFoundError('User', 42);
} catch (error) {
  console.log(error.name);     // 'NotFoundError'
  console.log(error.message);  // 'User with id 42 not found'
  console.log(error.resource); // 'User'
  console.log(error.id);       // 42
}


console.log('\n=== Exercise 6: instanceof check ===');
// TODO: Create handleError() that handles different error types differently
function handleError(error) {
  // If NotFoundError → log "Resource not found: [message]"
  // If TypeError → log "Type error: [message]"
  // Otherwise → log "Unknown error: [message]" and re-throw
  if (error instanceof NotFoundError) {
    console.log(`Resouce not found: ${error.message}`);
  } else if (error instanceof TypeError) {
    console.log(`TypeError: ${error.message}`);
  } else {
    console.log(`Unknown error: ${error.message}`);
    throw error;
  }
}
handleError(new NotFoundError('Product', 99));
handleError(new TypeError('Not a function'));
//handleError(new RangeError('Invalid range'));


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
  // Your code here
  if (maxRetries < 0) {
    throw new RangeError('maxRetries must be > 0');
  }

  if (fn === null || fn === undefined) {
    throw new TypeError('no function definition provided');
  }

  const retryContext = {
    attempt: 0,
    lastError: null
  };

  do {
   try {
    return fn();
   }
   catch(error) {
    retryContext.attempt++;
    retryContext.lastError = error;
   }
  } while (attempt < maxRetries);

  throw retryContext.lastError;
}

// Test it:
let attempt = 0;
try {
  retry(() => {
    attempt++;
    if (attempt < 3) throw new Error(`Attempt ${attempt} failed`);
    return 'success';
  }, 2);
  console.log('Succeeded on attempt:', attempt);
} catch (error) {
  console.log('All retries failed');
}


console.log('\n=== 🎯 Challenge: Validation with multiple errors ===');
// TODO: Create a function that validates a user object
// Collect ALL validation errors (not just the first one)
// Throw a single error with all messages

class ValidationError extends Error {
  constructor(errors) {
    let errorsFormatted = '';
    if (errors && Array.isArray(errors)) {
      errorsFormatted = 'Errors:\n\t' + errors.join('\n\t');
    }

    super('Validation failed. ' + errorsFormatted);
  }
}

function validateUser(user) {
  const errors = [];
  // Validate: name (string, >= 2 chars), age (number, 0-120), email (has @)
  // Collect all errors, then throw if any
  if (typeof user?.name !== 'string' || user.name.length < 2) {
    errors.push('Name must be a string with 2+ characters');
  }

  if (typeof user?.age !== 'number' ||
    user.age === NaN ||
    user.age < 0 ||
    user.age > 120) {
      errors.push('Age must be a number in the [0:120] range');
  }

  if (!user?.email || !user.email.includes('@')){
    errors.push('Email must contain "@"');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

try {
  validateUser({ name: 'A', age: -5, email: 'notanemail' });
} catch (error) {
  console.log(error.message); // Should show all 3 errors
}


console.log('\n✅ Exercises completed! Check your answers with a mentor.');
