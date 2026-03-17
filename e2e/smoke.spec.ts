import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('text=TubeForge')).toBeVisible();
  await expect(page.locator('text=Войти через Google')).toBeVisible();
});

test('redirects unauthenticated to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});
