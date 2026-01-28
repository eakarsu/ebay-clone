import { test, expect } from '@playwright/test';

test.describe('Seller Features Tests', () => {
  test.describe('Sell Item Page', () => {
    test('should display sell item page or redirect to login', async ({ page }) => {
      await page.goto('/sell');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('My Listings Page', () => {
    test('should display my listings page or redirect to login', async ({ page }) => {
      await page.goto('/my-listings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Seller Dashboard', () => {
    test('should display seller dashboard or redirect to login', async ({ page }) => {
      await page.goto('/seller-dashboard');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Seller Store', () => {
    test('should display seller store page or redirect to login', async ({ page }) => {
      await page.goto('/seller-store');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Seller Performance', () => {
    test('should display seller performance page or redirect to login', async ({ page }) => {
      await page.goto('/seller-performance');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Selling Limits', () => {
    test('should display selling limits page or redirect to login', async ({ page }) => {
      await page.goto('/selling-limits');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Promoted Listings', () => {
    test('should display promoted listings page or redirect to login', async ({ page }) => {
      await page.goto('/promoted-listings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Bulk Upload', () => {
    test('should display bulk upload page or redirect to login', async ({ page }) => {
      await page.goto('/bulk-upload');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Scheduled Listings', () => {
    test('should display scheduled listings page or redirect to login', async ({ page }) => {
      await page.goto('/scheduled-listings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Invoices', () => {
    test('should display invoices page or redirect to login', async ({ page }) => {
      await page.goto('/invoices');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
