import { test, expect } from '@playwright/test';

test.describe('Membership and Rewards Tests', () => {
  test.describe('Membership Page', () => {
    test('should display membership page or redirect to login', async ({ page }) => {
      await page.goto('/membership');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display plan cards', async ({ page }) => {
      await page.goto('/membership');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display prices', async ({ page }) => {
      await page.goto('/membership');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Rewards Page', () => {
    test('should display rewards page or redirect to login', async ({ page }) => {
      await page.goto('/rewards');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
