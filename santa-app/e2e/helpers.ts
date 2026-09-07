import { randomUUID } from 'node:crypto';
import { expect, type Browser, type Page } from '@playwright/test';

const E2E_PASSWORD = 'secret123';

export const STAMP = randomUUID().slice(0, 8);

export interface Session {
  page: Page;
  close: () => Promise<void>;
}

export async function newSession(
  browser: Browser,
  displayName: string,
  emailPrefix: string,
): Promise<Session> {
  const context = await browser.newContext();
  const page = await browser.newPage();

  await page.goto('/register');

  await page.getByLabel('Display name').fill(displayName);
  await page.getByLabel('Email').fill(`${emailPrefix}-${STAMP}@test.dev`);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByLabel('Confirm password').fill(E2E_PASSWORD);

  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/rooms$/);

  return { page, close: () => context.close() };
}

export function roomIdFrom(page: Page): string {
  const id = new URL(page.url()).pathname.split('/')[2];

  expect(id).toMatch(/^[a-f0-9]{24}$/);

  return id;
}
