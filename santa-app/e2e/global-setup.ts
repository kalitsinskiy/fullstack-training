import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

// Fixed accounts — same emails every run so retries are idempotent.
// If a registration returns 409 (already exists) we just log in instead.
export const ACCOUNTS = {
  owner: {
    name: 'E2E Owner',
    email: 'e2e-owner@test.local',
    password: 'Passw0rd!',
  },
  guest: {
    name: 'E2E Guest',
    email: 'e2e-guest@test.local',
    password: 'Passw0rd!',
  },
  third: {
    name: 'E2E Third',
    email: 'e2e-third@test.local',
    password: 'Passw0rd!',
  },
  authUser: {
    name: 'E2E Auth',
    email: 'e2e-auth@test.local',
    password: 'Passw0rd!',
  },
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function registerOrLogin(
  ctx: Awaited<ReturnType<typeof request.newContext>>,
  account: { name: string; email: string; password: string },
): Promise<string> {
  const reg = await ctx.post(`${API}/auth/register`, {
    data: {
      displayName: account.name,
      email: account.email,
      password: account.password,
    },
  });

  if (reg.ok()) {
    const { accessToken } = (await reg.json()) as { accessToken: string };
    return accessToken;
  }

  if (reg.status() === 409) {
    // Account already exists — just log in
    const login = await ctx.post(`${API}/auth/login`, {
      data: { email: account.email, password: account.password },
    });
    if (!login.ok())
      throw new Error(`Login failed for ${account.email}: ${login.status()}`);
    const { accessToken } = (await login.json()) as { accessToken: string };
    return accessToken;
  }

  if (reg.status() === 429) {
    console.log(
      `  Rate-limited — waiting 65s before retrying ${account.email}…`,
    );
    await sleep(65_000);
    return registerOrLogin(ctx, account);
  }

  throw new Error(`Unexpected ${reg.status()} registering ${account.email}`);
}

export default async function globalSetup() {
  console.log('\n[E2E setup] Seeding test accounts…');
  const ctx = await request.newContext();
  const tokens: Record<string, string> = {};

  for (const [key, account] of Object.entries(ACCOUNTS)) {
    process.stdout.write(`  • ${account.email} … `);
    tokens[key] = await registerOrLogin(ctx, account);
    console.log('ok');
    // Small pause between registrations to stay comfortably inside the 3/min limit.
    await sleep(500);
  }

  await ctx.dispose();

  const dir = path.join(__dirname, '.auth');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'accounts.json'),
    JSON.stringify({ tokens }, null, 2),
  );
  console.log('[E2E setup] Done.\n');
}
