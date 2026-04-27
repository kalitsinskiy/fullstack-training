// ============================================
// CUSTOM ERRORS Examples
// ============================================

console.log('=== 1. Built-in Error Types ===');

// TypeError - wrong type
try {
  null.property;
} catch (e) {
  console.log(`${e.name}: ${e.message}`);
}

// ReferenceError - undefined variable
try {
  undeclaredVar;
} catch (e) {
  console.log(`${e.name}: ${e.message}`);
}

// RangeError - value out of range
try {
  new Array(-1);
} catch (e) {
  console.log(`${e.name}: ${e.message}`);
}

// SyntaxError - can't catch at runtime from eval
try {
  JSON.parse('{invalid}');
} catch (e) {
  console.log(`${e.name}: ${e.message}`);
}

console.log('\n=== 2. Creating Custom Error Classes ===');

// Extend the built-in Error class
class ValidationError extends Error {
  constructor(message, field) {
    super(message); // Call parent constructor with message
    this.name = 'ValidationError'; // Override name
    this.field = field; // Add custom property
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id '${id}' not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
    this.statusCode = 404;
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

// Using custom errors
try {
  throw new ValidationError('Email is required', 'email');
} catch (error) {
  console.log('name:', error.name);
  console.log('message:', error.message);
  console.log('field:', error.field);
}

try {
  throw new NotFoundError('User', 42);
} catch (error) {
  console.log('name:', error.name);
  console.log('message:', error.message);
  console.log('statusCode:', error.statusCode);
}

console.log('\n=== 3. Checking Error Type with instanceof ===');

function handleError(error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed on field: ${error.field}`);
    console.log('Message:', error.message);
  } else if (error instanceof NotFoundError) {
    console.log(`404: ${error.resource} #${error.id} not found`);
  } else if (error instanceof TypeError) {
    console.log('Type error - check your data types');
  } else {
    console.log('Unknown error:', error.message);
    throw error; // Re-throw unknown errors
  }
}

handleError(new ValidationError('Too short', 'password'));
handleError(new NotFoundError('Product', 99));
handleError(new TypeError('Wrong type'));

console.log('\n=== 4. Error Hierarchy ===');

// Build a hierarchy of related errors
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 'DB_ERROR');
    this.name = 'DatabaseError';
    this.query = query;
  }
}

class ConnectionError extends DatabaseError {
  constructor(host) {
    super(`Cannot connect to database at ${host}`, `CONNECT ${host}`);
    this.name = 'ConnectionError';
    this.host = host;
  }
}

const connError = new ConnectionError('localhost:5432');
console.log('Is AppError?', connError instanceof AppError); // true
console.log('Is DatabaseError?', connError instanceof DatabaseError); // true
console.log('Is ConnectionError?', connError instanceof ConnectionError); // true
console.log('Error code:', connError.code);
console.log('Host:', connError.host);

console.log('\n=== 5. Practical: Form Validation ===');

class FormValidationError extends Error {
  constructor(errors) {
    super('Form validation failed');
    this.name = 'FormValidationError';
    this.errors = errors; // Array of { field, message } objects
  }

  getFieldError(field) {
    return this.errors.find((e) => e.field === field)?.message;
  }

  hasErrors() {
    return this.errors.length > 0;
  }
}

function validateRegistration(data) {
  const errors = [];

  if (!data.username || data.username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push({ field: 'email', message: 'Must be a valid email' });
  }

  if (!data.password || data.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  if (errors.length > 0) {
    throw new FormValidationError(errors);
  }

  return true;
}

// Valid data
try {
  validateRegistration({
    username: 'alice',
    email: 'alice@example.com',
    password: 'secure123',
  });
  console.log('Registration valid!');
} catch (error) {
  console.log('Error:', error.message);
}

// Invalid data
try {
  validateRegistration({
    username: 'al', // too short
    email: 'not-email', // invalid
    password: 'short', // too short
  });
} catch (error) {
  if (error instanceof FormValidationError) {
    console.log('\nValidation errors:');
    error.errors.forEach((e) => console.log(` - ${e.field}: ${e.message}`));
    console.log('Username error:', error.getFieldError('username'));
  }
}

console.log('\n=== 6. Error Wrapping ===');

// Wrap low-level errors with context
async function getUserFromDB(id) {
  try {
    // Simulate DB operation that throws
    throw new Error('Connection refused');
  } catch (error) {
    // Wrap with more context
    throw new DatabaseError(
      `Failed to get user #${id}: ${error.message}`,
      `SELECT * FROM users WHERE id = ${id}`
    );
  }
}

(async () => {
  try {
    await getUserFromDB(1);
  } catch (error) {
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Query:', error.query);
  }
})();

console.log('\n=== Best Practices ===');
console.log('1. Create custom errors for domain-specific failures');
console.log('2. Always call super(message) in custom error constructors');
console.log('3. Set this.name to the class name');
console.log('4. Use instanceof to check error type');
console.log('5. Build an error hierarchy for related error types');
console.log('6. Include helpful context (field, statusCode, etc.)');
console.log('7. Wrap low-level errors with higher-level context');
