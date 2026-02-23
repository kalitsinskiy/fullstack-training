// ============================================
// TEMPLATE LITERALS Examples
// ============================================

console.log('=== 1. Basic Template Literals ===');

const name = 'Alice';
const age = 25;

// Old way
const old = 'Hello, ' + name + '! You are ' + age + ' years old.';

// Template literal
const modern = `Hello, ${name}! You are ${age} years old.`;

console.log('Old:', old);
console.log('Modern:', modern);

console.log('\n=== 2. Expressions Inside ${} ===');

const a = 10;
const b = 5;

console.log(`Sum: ${a + b}`);                     // 15
console.log(`Max: ${Math.max(a, b)}`);            // 10
console.log(`Status: ${age >= 18 ? 'Adult' : 'Minor'}`); // Adult
console.log(`Uppercase: ${name.toUpperCase()}`);  // ALICE

// Function calls
function greet(n) {
  return `Hello, ${n}!`;
}
console.log(`Nested: ${greet('Bob')}`);

console.log('\n=== 3. Multi-line Strings ===');

// Old way (awkward)
const multiOld = 'Line 1\n' +
                 'Line 2\n' +
                 'Line 3';

// Template literal (natural)
const multiModern = `Line 1
Line 2
Line 3`;

console.log('Old:', multiOld);
console.log('Modern:', multiModern);

console.log('\n=== 4. HTML Templates ===');

const user = { name: 'Alice', role: 'Admin', email: 'alice@example.com' };

const html = `
  <div class="user-card">
    <h2>${user.name}</h2>
    <p>Role: ${user.role}</p>
    <a href="mailto:${user.email}">${user.email}</a>
  </div>
`.trim();

console.log('HTML:', html);

console.log('\n=== 5. Nested Templates ===');

const items = ['apple', 'banana', 'orange'];

const list = `
Items:
${items.map((item, i) => `  ${i + 1}. ${item}`).join('\n')}
Total: ${items.length}
`.trim();

console.log('List:', list);

console.log('\n=== 6. Tagged Templates (Advanced) ===');

// Tags are functions that process template literals
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    return result + `[${value}]` + str;
  });
}

const product = 'Laptop';
const price = 999;

console.log(highlight`Product: ${product} costs $${price}`);
// 'Product: [Laptop] costs $[999]'

// Practical tag: safe HTML escaping
function safeHTML(strings, ...values) {
  const escaped = values.map(v =>
    String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  );

  return strings.reduce((result, str, i) => {
    return result + str + (escaped[i - 1] || '');
  });
}

const userInput = '<script>alert("xss")</script>';
const safe = safeHTML`<p>User said: ${userInput}</p>`;
console.log('Safe HTML:', safe);

console.log('\n=== 7. Building SQL / Query Strings ===');

function buildQuery(table, conditions) {
  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  return `SELECT * FROM ${table} ${where}`.trim();
}

console.log(buildQuery('users', []));
console.log(buildQuery('users', ['age > 18', 'active = true']));

console.log('\n=== 8. Practical Patterns ===');

// Error messages
function createError(field, value, expected) {
  return `Validation failed: '${field}' received '${value}' but expected ${expected}`;
}

console.log(createError('age', 'twenty', 'a number'));

// URL building
const baseUrl = 'https://jsonplaceholder.typicode.com';
const endpoint = 'users';
const id = 42;
const url = `${baseUrl}/${endpoint}/${id}`;
console.log('URL:', url);

// Log formatting
function logInfo(action, data) {
  console.log(`[${new Date().toISOString()}] ${action}:`, data);
}

logInfo('USER_LOGIN', { userId: 1, email: 'alice@example.com' });

console.log('\n=== Best Practices ===');
console.log('1. Prefer template literals over string concatenation');
console.log('2. Use multi-line template literals for HTML/SQL strings');
console.log('3. Keep expressions in ${} simple - extract to variables if complex');
console.log('4. Use tagged templates for escaping/formatting when needed');
console.log('5. Indent template content naturally for readability');
