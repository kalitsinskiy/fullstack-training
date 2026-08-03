import { test, expect } from '@playwright/test';
import { loginAs, USERS } from './helpers';

// Full critical-path journey:
//   create → join (×2) → wishlist → draw → assignment → anonymous message
//
// Uses three separate browser contexts so user1/2/3 are genuinely isolated
// sessions. Relies on the pre-seeded test accounts from the credentials list.
// Rate limiting is skipIf NODE_ENV=test — run the dev server in test mode or
// with rate limiting disabled (see Lesson 10 README gotcha #2).

test('create → join → wishlist → draw → assignment → message', async ({ browser }) => {
  // ── Three independent sessions ─────────────────────────────────────────────
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const ctx3 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();
  const page3 = await ctx3.newPage();

  // ── 1. All three users log in ───────────────────────────────────────────────
  await Promise.all([
    loginAs(page1, USERS.user1.email, USERS.user1.password),
    loginAs(page2, USERS.user2.email, USERS.user2.password),
    loginAs(page3, USERS.user3.email, USERS.user3.password),
  ]);

  // ── 2. User1 creates a room ─────────────────────────────────────────────────
  const roomName = `E2E Room ${Date.now()}`;
  await page1.getByPlaceholder('Room name').fill(roomName);
  await page1.getByRole('button', { name: /^create$/i }).click();

  // Should navigate to room detail — match the page heading, not the toast
  await expect(page1).toHaveURL(/\/rooms\/.+/);
  await expect(page1.getByRole('heading', { name: roomName })).toBeVisible();

  // Grab invite code from the read-only input
  const inviteCode = await page1.getByTestId('invite-code').inputValue();
  expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);

  // ── 3. User1 sets a wishlist ────────────────────────────────────────────────
  await page1.getByPlaceholder('One gift idea per line').fill('Coffee machine\nBooks');
  await page1.getByRole('button', { name: /save wishlist/i }).click();
  await expect(page1.getByText('Wishlist saved')).toBeVisible();

  // ── 4. User2 joins with invite code ────────────────────────────────────────
  await page2.getByPlaceholder('Invite code').fill(inviteCode);
  await page2.getByRole('button', { name: /^join$/i }).click();
  await expect(page2).toHaveURL(/\/rooms\/.+/);
  await expect(page2.getByRole('heading', { name: roomName })).toBeVisible();

  // ── 5. User3 joins with same invite code ───────────────────────────────────
  await page3.getByPlaceholder('Invite code').fill(inviteCode);
  await page3.getByRole('button', { name: /^join$/i }).click();
  await expect(page3).toHaveURL(/\/rooms\/.+/);
  await expect(page3.getByRole('heading', { name: roomName })).toBeVisible();

  // ── 6. User1 sees 3 participants before draw ───────────────────────────────
  await expect(page1.getByText('3 participants')).toBeVisible();

  // ── 7. User1 runs the draw ─────────────────────────────────────────────────
  await page1.getByRole('button', { name: /draw names/i }).click();

  // Dialog opens — pick a date two months in the future by typing in the next
  // available month's first day via the calendar navigation
  const dialog = page1.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Navigate one month forward and click day 15
  await dialog.getByRole('button', { name: /next month/i }).click();
  await dialog.getByRole('button', { name: '15' }).first().click();

  // Confirm
  await dialog.getByRole('button', { name: /confirm/i }).click();

  // Toast confirms success
  await expect(page1.getByText('Draw completed!')).toBeVisible();

  // ── 8. User1 can see their assignment ──────────────────────────────────────
  await expect(page1.getByText("You're gifting")).toBeVisible();

  // The assigned name must not be "User1" (no self-assignment)
  const gifteeText = await page1.locator('text=You\'re gifting').textContent();
  expect(gifteeText).not.toContain(USERS.user1.name);

  // ── 9. User2 can see their assignment (page may need a reload after draw) ──
  await page2.reload();
  await expect(page2.getByText("You're gifting")).toBeVisible({ timeout: 10_000 });
  const gifteeName2 = await page2.locator('strong.text-primary').first().textContent();
  expect(gifteeName2).not.toBe(USERS.user2.name);

  // ── 10. User1 sends an anonymous message to their giftee ───────────────────
  await page1.getByRole('button', { name: /messages/i }).click();
  await expect(page1).toHaveURL(/\/rooms\/.+\/messages/);

  // Giftee tab is active by default — type and send a message
  const msgInput = page1.getByPlaceholder(/message.+/i);
  await msgInput.fill('Hello from your Secret Santa!');
  await page1.getByRole('button', { name: /send/i }).click();

  // Sent message appears in the bubble area
  await expect(page1.getByText('Hello from your Secret Santa!')).toBeVisible();

  await ctx1.close();
  await ctx2.close();
  await ctx3.close();
});

// ── Standalone smoke tests (no full stack state required) ──────────────────

test('login page renders and rejects wrong password', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  await page.getByLabel('Email').fill(USERS.user1.email);
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Toast li items appear immediately after the error response; check before auto-dismiss
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  await expect(page).toHaveURL('/login');
});

test('register page rejects mismatched passwords', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Display name').fill('Test User');
  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Confirm password').fill('different456');
  await page.getByRole('button', { name: /create account/i }).click();

  // Client-side toast fires immediately (no API call made)
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  await expect(page).toHaveURL('/register');
});

test('protected route redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/rooms');
  await expect(page).toHaveURL(/\/login/);
});
