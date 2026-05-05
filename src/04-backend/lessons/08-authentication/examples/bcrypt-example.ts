export {};
// ============================================
// bcrypt — Password Hashing
// ============================================
// Run: npx ts-node src/04-backend/lessons/08-authentication/examples/bcrypt-example.ts
// Deps: bcrypt + @types/bcrypt are listed in the repo root package.json — `npm install` at the root.

import bcrypt from 'bcrypt';

async function main(): Promise<void> {
  console.log('=== bcrypt Examples ===\n');

  // --- 1. Hash a password ---
  console.log('--- 1. Hashing a password ---');

  const plainPassword = 'MySecretPassword123!';
  const saltRounds = 10; // 2^10 iterations; higher = slower + more secure

  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Plain password:', plainPassword);
  console.log('Hashed:', hash);
  console.log('Hash length:', hash.length); // always 60 characters

  // The hash contains everything needed to verify:
  // $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
  // |__|__|______________________|______________________________|
  //  alg cost       salt (22 chars)          hash (31 chars)

  // --- 2. Verify a password ---
  console.log('\n--- 2. Verifying passwords ---');

  const isCorrect = await bcrypt.compare('MySecretPassword123!', hash);
  console.log('Correct password:', isCorrect); // true

  const isWrong = await bcrypt.compare('WrongPassword', hash);
  console.log('Wrong password:', isWrong); // false

  // --- 3. Same password produces different hashes ---
  console.log('\n--- 3. Different hashes for same password ---');

  const hash1 = await bcrypt.hash(plainPassword, saltRounds);
  const hash2 = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log('Are they equal?', hash1 === hash2); // false! Different salt each time

  // But both verify correctly:
  console.log('Hash 1 verifies:', await bcrypt.compare(plainPassword, hash1)); // true
  console.log('Hash 2 verifies:', await bcrypt.compare(plainPassword, hash2)); // true

  // --- 4. Salt rounds performance ---
  console.log('\n--- 4. Salt rounds performance comparison ---');

  for (const rounds of [8, 10, 12]) {
    const start = Date.now();
    await bcrypt.hash('test', rounds);
    const elapsed = Date.now() - start;
    console.log(`Salt rounds ${rounds}: ${elapsed}ms`);
  }
  // Each additional round roughly doubles the time

  // --- 5. Manual salt generation ---
  console.log('\n--- 5. Manual salt generation ---');

  const salt = await bcrypt.genSalt(10);
  console.log('Generated salt:', salt);

  const hashWithSalt = await bcrypt.hash(plainPassword, salt);
  console.log('Hash with manual salt:', hashWithSalt);

  // --- 6. Practical: register and login simulation ---
  console.log('\n--- 6. Register + Login simulation ---');

  // Simulated user database
  const db = new Map<string, { email: string; passwordHash: string }>();

  // Register
  async function register(email: string, password: string): Promise<void> {
    if (db.has(email)) throw new Error('User already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    db.set(email, { email, passwordHash });
    console.log(`Registered: ${email}`);
  }

  // Login
  async function login(email: string, password: string): Promise<boolean> {
    const user = db.get(email);
    if (!user) {
      console.log(`Login failed: user ${email} not found`);
      return false;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Login ${isValid ? 'successful' : 'failed'}: ${email}`);
    return isValid;
  }

  await register('alice@example.com', 'AlicePass123');
  await login('alice@example.com', 'AlicePass123');   // successful
  await login('alice@example.com', 'WrongPassword');  // failed
  await login('bob@example.com', 'anything');          // not found

  console.log('\nDone.');
}

main().catch(console.error);
