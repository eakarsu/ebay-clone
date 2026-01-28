import { test, expect } from '@playwright/test';

test.describe('User Account Tests', () => {
  test.describe('Profile Page', () => {
    test('should display profile page or redirect to login', async ({ page }) => {
      await page.goto('/profile');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Orders Page', () => {
    test('should display orders page or redirect to login', async ({ page }) => {
      await page.goto('/orders');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Returns Page', () => {
    test('should display returns page or redirect to login', async ({ page }) => {
      await page.goto('/returns');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Security Settings', () => {
    test('should display security settings page or redirect to login', async ({ page }) => {
      await page.goto('/security-settings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Notifications Page', () => {
    test('should display notifications page or redirect to login', async ({ page }) => {
      await page.goto('/notifications');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Saved Searches', () => {
    test('should display saved searches page or redirect to login', async ({ page }) => {
      await page.goto('/saved-searches');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Price Alerts', () => {
    test('should display price alerts page or redirect to login', async ({ page }) => {
      await page.goto('/price-alerts');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('My Offers', () => {
    test('should display my offers page or redirect to login', async ({ page }) => {
      await page.goto('/my-offers');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Collections', () => {
    test('should display collections page or redirect to login', async ({ page }) => {
      await page.goto('/collections');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Disputes', () => {
    test('should display disputes page or redirect to login', async ({ page }) => {
      await page.goto('/disputes');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
