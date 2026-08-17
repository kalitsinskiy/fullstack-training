import { type Page, expect } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/rooms/);
}

export const USERS = {
  user1: { email: 'test_user1@example.com', password: 'password123', name: 'User1' },
  user2: { email: 'test_user2@example.com', password: 'password123', name: 'User2' },
  user3: { email: 'test_user3@example.com', password: 'password123', name: 'User3' },
} as const;
