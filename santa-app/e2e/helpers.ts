import { expect, type Page } from '@playwright/test';

export const STAMP = process.env.E2E_STAMP ?? 'local';

export const PASSWORD = 'Passw0rd!';

export function emailFor(role: string): string {
  return `e2e-${role}@e2e.test`;
}

export async function signIn(page: Page, displayName: string, role: string) {
  const email = emailFor(role);

  await page.goto('/register');
  await page.getByLabel('Display name').fill(displayName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();

  const registered = await page
    .waitForURL(/\/rooms$/, { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (!registered) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/rooms$/);
  }

  await expect(page.getByRole('heading', { name: 'Your rooms' })).toBeVisible();
}

export async function createRoom(page: Page, name: string): Promise<string> {
  await page.getByRole('button', { name: /new room/i }).click();
  await page.getByLabel('Room name').fill(name);
  await page.getByRole('button', { name: /^create room$/i }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await openRoom(page, name);

  const code = (await page.getByTestId('invite-code').innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  return code;
}

export async function joinRoom(page: Page, inviteCode: string, roomName: string) {
  await page.getByRole('button', { name: /join with code/i }).first().click();
  await page.getByLabel('Invite code').fill(inviteCode);
  await page.getByRole('button', { name: /^join room$/i }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await openRoom(page, roomName);
}

export async function openRoom(page: Page, roomName: string) {
  const card = page
    .locator('div')
    .filter({ hasText: roomName })
    .filter({ has: page.getByRole('link', { name: 'Open' }) })
    .last();

  await card.getByRole('link', { name: 'Open' }).click();
  await expect(page.getByRole('heading', { name: roomName })).toBeVisible();
}

export async function openRoomMessages(page: Page) {
  const roomUrl = new URL(page.url());
  expect(roomUrl.pathname).toMatch(/^\/rooms\/[a-f0-9]{24}$/);

  await page.goto(`${roomUrl.pathname}/messages`);
  await expect(page.getByRole('tablist', { name: 'Chats' })).toBeVisible();
}

export async function runDraw(page: Page) {
  await page.getByRole('button', { name: /draw names/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('button.rdp-day_button:not([disabled])').first().click();
  await dialog.getByRole('button', { name: /^draw names$/i }).click();

  await expect(dialog).toBeHidden();
}
