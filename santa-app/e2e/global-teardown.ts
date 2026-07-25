import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ACCOUNTS } from './global-setup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

export default async function globalTeardown() {
  const accountsPath = path.join(__dirname, '.auth', 'accounts.json');
  if (!fs.existsSync(accountsPath)) return;

  const { tokens } = JSON.parse(fs.readFileSync(accountsPath, 'utf-8')) as {
    tokens: Record<string, string>;
  };

  console.log('\n[E2E teardown] Deleting rooms created during tests…');
  const ctx = await request.newContext();

  for (const [key] of Object.entries(ACCOUNTS)) {
    const token = tokens[key];
    if (!token) continue;

    const res = await ctx.get(`${API}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) continue;

    const body = (await res.json()) as {
      data: Array<{ id: string; name: string }>;
    };
    const e2eRooms = body.data.filter((r) => r.name.startsWith('E2E'));

    for (const room of e2eRooms) {
      const del = await ctx.delete(`${API}/rooms/${room.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`  • deleted "${room.name}" (${room.id}): ${del.status()}`);
    }
  }

  await ctx.dispose();
  console.log('[E2E teardown] Done.\n');
}
