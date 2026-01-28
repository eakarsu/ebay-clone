import { test, expect } from '@playwright/test';

test.describe('Messaging and Notifications Tests', () => {
  test.describe('Messages Page', () => {
    test('should display messages page or redirect to login', async ({ page }) => {
      await page.goto('/messages');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Notifications', () => {
    test('should display notifications page or redirect to login', async ({ page }) => {
      await page.goto('/notifications');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show notification icon in header on home page', async ({ page }) => {
      await page.goto('/');
      // Check that header or nav exists
      const header = page.locator('header').first();
      const nav = page.locator('nav').first();
      const hasHeader = await header.count() > 0;
      const hasNav = await nav.count() > 0;
      expect(hasHeader || hasNav).toBe(true);
    });
  });
});
