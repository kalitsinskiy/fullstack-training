import { Page, expect } from '@playwright/test';
export async function login(page: Page, email: string, password = 'Passw0rd!') {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/rooms/);
}
