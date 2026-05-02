export {};
// ============================================
// JWT — JSON Web Tokens
// ============================================
// Run: npx ts-node src/04-backend/lessons/08-authentication/examples/jwt-example.ts
// Deps: jsonwebtoken + @types/jsonwebtoken are listed in the repo root package.json — `npm install` at the root.

import jwt from 'jsonwebtoken';

function main(): void {
  console.log('=== JWT Examples ===\n');

  const SECRET = 'my-super-secret-key-change-in-production';

  // --- 1. Sign (create) a token ---
  console.log('--- 1. Creating a JWT ---');

  const token = jwt.sign(
    {
      sub: 'user_42',
      email: 'alice@example.com',
      role: 'user',
    },
    SECRET,
    { expiresIn: '1h' }, // token expires in 1 hour
  );

  console.log('Token:', token);
  console.log('Token parts:', token.split('.').length); // 3

  // --- 2. Decode the structure (without verification) ---
  console.log('\n--- 2. Decoding token structure ---');

  const parts = token.split('.');
  const header = JSON.parse(Buffer.from(parts[0]!, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString());

  console.log('Header:', header);
  // { alg: 'HS256', typ: 'JWT' }

  console.log('Payload:', payload);
  // { sub: 'user_42', email: 'alice@example.com', role: 'user', iat: ..., exp: ... }

  console.log('Issued at:', new Date(payload.iat * 1000).toISOString());
  console.log('Expires at:', new Date(payload.exp * 1000).toISOString());

  // --- 3. Verify a token ---
  console.log('\n--- 3. Verifying a token ---');

  try {
    const verified = jwt.verify(token, SECRET) as jwt.JwtPayload;
    console.log('Verified payload:', verified);
    console.log('User ID:', verified.sub);
    console.log('Email:', verified.email);
  } catch (error) {
    console.error('Verification failed:', error);
  }

  // --- 4. Verification with wrong secret fails ---
  console.log('\n--- 4. Wrong secret ---');

  try {
    jwt.verify(token, 'wrong-secret');
    console.log('Should not reach here');
  } catch (error: any) {
    console.log('Error type:', error.name); // JsonWebTokenError
    console.log('Error message:', error.message); // invalid signature
  }

  // --- 5. Expired token ---
  console.log('\n--- 5. Expired token ---');

  const expiredToken = jwt.sign(
    { sub: 'user_42' },
    SECRET,
    { expiresIn: '0s' }, // expires immediately
  );

  try {
    jwt.verify(expiredToken, SECRET);
    console.log('Should not reach here');
  } catch (error: any) {
    console.log('Error type:', error.name); // TokenExpiredError
    console.log('Error message:', error.message); // jwt expired
    console.log('Expired at:', error.expiredAt);
  }

  // --- 6. Custom claims ---
  console.log('\n--- 6. Custom claims ---');

  const adminToken = jwt.sign(
    {
      sub: 'admin_1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['rooms:create', 'rooms:delete', 'users:manage'],
    },
    SECRET,
    { expiresIn: '30m' },
  );

  const adminPayload = jwt.verify(adminToken, SECRET) as jwt.JwtPayload;
  console.log('Admin permissions:', adminPayload.permissions);
  console.log('Is admin:', adminPayload.role === 'admin');

  // --- 7. jwt.decode() vs jwt.verify() ---
  console.log('\n--- 7. decode() vs verify() ---');

  // decode() does NOT verify the signature — never use for auth decisions
  const decoded = jwt.decode(token, { complete: true });
  console.log('Decoded (no verification):', decoded);

  // DANGER: decode() would succeed even with a tampered token!
  // Always use verify() for authentication.

  // --- 8. Different algorithms ---
  console.log('\n--- 8. Algorithm info ---');
  console.log('HS256: HMAC + SHA-256 (symmetric — same key to sign and verify)');
  console.log('RS256: RSA + SHA-256 (asymmetric — private key signs, public key verifies)');
  console.log('For microservices, RS256 is preferred: only auth service has private key.');

  console.log('\nDone.');
}

main();
