import { Page, expect } from '@playwright/test';

export async function register(
  page: Page,
  name: string,
  email: string,
  password = 'Passw0rd!',
) {
  await page.goto('/register');
  await page.locator('#displayName').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/rooms/);
}

export async function login(page: Page, email: string, password = 'Passw0rd!') {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/rooms/);
}

/** Register via the API directly — avoids the 3/min browser rate-limit throttle. */
export async function registerViaApi(
  request: {
    post: (
      url: string,
      opts: { data: object },
    ) => Promise<{
      ok: () => boolean;
      json: () => Promise<{ accessToken: string }>;
    }>;
  },
  name: string,
  email: string,
  password = 'Passw0rd!',
): Promise<string> {
  const res = await request.post('http://localhost:3001/api/auth/register', {
    data: { displayName: name, email, password },
  });
  if (!res.ok()) throw new Error(`Register failed for ${email}`);
  const { accessToken } = await res.json();
  return accessToken;
}
