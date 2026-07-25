import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { ACCOUNTS } from './global-setup';

test.describe('Auth', () => {
  test('register and land on rooms page', async ({ page }) => {
    // Use the pre-seeded authUser account (already registered by globalSetup).
    await login(page, ACCOUNTS.authUser.email, ACCOUNTS.authUser.password);
    await expect(page.getByText('Your rooms')).toBeVisible();
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(ACCOUNTS.authUser.email);
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByText(/invalid|incorrect|wrong|password|credentials/i),
    ).toBeVisible();
  });
});

test.describe('create → join → draw → assignment', () => {
  test('full Secret Santa journey', async ({ browser }) => {
    // Open two independent browser sessions.
    const ownerCtx = await browser.newContext();
    const guestCtx = await browser.newContext();
    const thirdCtx = await browser.newContext();
    const ownerPage = await ownerCtx.newPage();
    const guestPage = await guestCtx.newPage();
    const thirdPage = await thirdCtx.newPage();

    // ── Step 1: All three participants log in ─────────────────────────────────
    await login(ownerPage, ACCOUNTS.owner.email, ACCOUNTS.owner.password);
    await login(guestPage, ACCOUNTS.guest.email, ACCOUNTS.guest.password);
    await login(thirdPage, ACCOUNTS.third.email, ACCOUNTS.third.password);

    // ── Step 2: Owner creates a room ──────────────────────────────────────────
    await ownerPage.getByRole('button', { name: 'New room' }).click();
    await ownerPage.locator('#roomName').fill('E2E Room');
    await ownerPage
      .getByRole('button', { name: 'Create', exact: true })
      .click();

    await expect(ownerPage.getByText('E2E Room')).toBeVisible();
    await ownerPage.getByText('E2E Room').click();
    await expect(ownerPage).toHaveURL(/\/rooms\/[a-f0-9]+/);

    const inviteCode = (
      await ownerPage.locator('code').first().innerText()
    ).trim();
    expect(inviteCode).toBeTruthy();

    // ── Step 3: Guest and third participant join ───────────────────────────────
    for (const [page] of [[guestPage], [thirdPage]] as const) {
      await page
        .getByRole('button', { name: 'Join with code' })
        .first()
        .click();
      await page.locator('#inviteCode').fill(inviteCode);
      await page.getByRole('button', { name: 'Join', exact: true }).click();
      await expect(page.getByText('E2E Room')).toBeVisible({ timeout: 10_000 });
    }

    // ── Step 4: Owner reloads and runs the draw ────────────────────────────────
    await ownerPage.reload();
    const drawBtn = ownerPage.getByRole('button', { name: 'Draw names' });
    await expect(drawBtn).toBeEnabled();
    await drawBtn.click();

    const dialog = ownerPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Navigate to next month and pick the first available (non-disabled, non-outside) day.
    await dialog.getByRole('button', { name: 'Go to the Next Month' }).click();
    await dialog
      .locator('.rdp-day:not(.rdp-disabled):not(.rdp-outside) .rdp-day_button')
      .first()
      .click();
    await dialog.getByRole('button', { name: 'Draw names' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // ── Step 5: Owner sees their assignment ───────────────────────────────────
    await expect(ownerPage.getByText('Your giftee')).toBeVisible({
      timeout: 20_000,
    });
    await expect(ownerPage.getByText(/You're gifting/)).toBeVisible();
    await expect(
      ownerPage.getByText("You're gifting E2E Owner"),
    ).not.toBeVisible();

    // ── Step 6: Guest navigates to the drawn room and sees their assignment ───
    await guestPage.getByRole('link', { name: /E2E Room/ }).click();
    await expect(guestPage).toHaveURL(/\/rooms\/[a-f0-9]+/);
    await expect(guestPage.getByText('Your giftee')).toBeVisible();
    await expect(guestPage.getByText(/You're gifting/)).toBeVisible();

    await ownerCtx.close();
    await guestCtx.close();
    await thirdCtx.close();
  });
});
