import { createHmac } from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export function verifyHs256(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure');

  const [headerB64, payloadB64, sigB64] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (expected !== sigB64) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(
    Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
  ) as JwtPayload;

  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('JWT expired');

  return payload;
}
