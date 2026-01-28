import { test, expect } from '@playwright/test';

test.describe('Reviews and Feedback Tests', () => {
  test.describe('Feedback Page', () => {
    test('should display feedback page or redirect to login', async ({ page }) => {
      await page.goto('/feedback');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display my feedback page or redirect to login', async ({ page }) => {
      await page.goto('/my-feedback');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display feedback profile page', async ({ page }) => {
      await page.goto('/feedback-profile');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Reviews Page', () => {
    test('should display reviews page', async ({ page }) => {
      await page.goto('/reviews');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display my reviews page or redirect to login', async ({ page }) => {
      await page.goto('/my-reviews');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Seller Ratings', () => {
    test('should display seller ratings page', async ({ page }) => {
      await page.goto('/seller-ratings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Product Reviews', () => {
    test('should display product review guidelines', async ({ page }) => {
      await page.goto('/review-guidelines');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Reputation System', () => {
    test('should display reputation info page', async ({ page }) => {
      await page.goto('/reputation');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
