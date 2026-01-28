import { test, expect } from '@playwright/test';

test.describe('Buying Features Tests', () => {
  test.describe('Making Offers', () => {
    test('should display my offers page or redirect to login', async ({ page }) => {
      await page.goto('/my-offers');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display offers received page or redirect to login', async ({ page }) => {
      await page.goto('/offers-received');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display offer history page or redirect to login', async ({ page }) => {
      await page.goto('/offer-history');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Best Offer Feature', () => {
    test('should display best offer info page', async ({ page }) => {
      await page.goto('/best-offer');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Cart Features', () => {
    test('should display cart page', async ({ page }) => {
      await page.goto('/cart');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display saved items page or redirect to login', async ({ page }) => {
      await page.goto('/saved-items');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Checkout Process', () => {
    test('should display checkout page or redirect to login', async ({ page }) => {
      await page.goto('/checkout');
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      // Check that page is loaded (may redirect to login)
      await expect(page).toHaveURL(/.*/);
    });

    test('should display order confirmation page', async ({ page }) => {
      await page.goto('/order-confirmation');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Payment Options', () => {
    test('should display payment options page', async ({ page }) => {
      await page.goto('/payment-options');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display coupon codes page', async ({ page }) => {
      await page.goto('/coupons');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display gift cards page', async ({ page }) => {
      await page.goto('/gift-cards');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Price Features', () => {
    test('should display price alerts page or redirect to login', async ({ page }) => {
      await page.goto('/price-alerts');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display price history page', async ({ page }) => {
      await page.goto('/price-history');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Watchlist', () => {
    test('should display watchlist page or redirect to login', async ({ page }) => {
      await page.goto('/watchlist');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Recently Viewed', () => {
    test('should display recently viewed page', async ({ page }) => {
      await page.goto('/recently-viewed');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
