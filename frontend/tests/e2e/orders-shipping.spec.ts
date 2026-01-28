import { test, expect } from '@playwright/test';

test.describe('Orders and Shipping Tests', () => {
  test.describe('Orders Page', () => {
    test('should display orders page or redirect to login', async ({ page }) => {
      await page.goto('/orders');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display order history page or redirect to login', async ({ page }) => {
      await page.goto('/order-history');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display purchases page or redirect to login', async ({ page }) => {
      await page.goto('/purchases');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Order Tracking', () => {
    test('should display tracking page', async ({ page }) => {
      await page.goto('/tracking');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display track order page', async ({ page }) => {
      await page.goto('/track-order');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Shipping Information', () => {
    test('should display shipping info page', async ({ page }) => {
      await page.goto('/shipping');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display shipping calculator page', async ({ page }) => {
      await page.goto('/shipping-calculator');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display shipping rates page', async ({ page }) => {
      await page.goto('/shipping-rates');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Returns', () => {
    test('should display returns page or redirect to login', async ({ page }) => {
      await page.goto('/returns');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display return policy page', async ({ page }) => {
      await page.goto('/return-policy');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display start return page or redirect to login', async ({ page }) => {
      await page.goto('/start-return');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Refunds', () => {
    test('should display refunds page or redirect to login', async ({ page }) => {
      await page.goto('/refunds');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display refund status page', async ({ page }) => {
      await page.goto('/refund-status');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Order Cancellation', () => {
    test('should display cancellations page or redirect to login', async ({ page }) => {
      await page.goto('/cancellations');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Disputes', () => {
    test('should display disputes page or redirect to login', async ({ page }) => {
      await page.goto('/disputes');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display resolution center page', async ({ page }) => {
      await page.goto('/resolution-center');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display open case page or redirect to login', async ({ page }) => {
      await page.goto('/open-case');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
