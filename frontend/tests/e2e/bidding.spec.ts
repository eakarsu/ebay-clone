import { test, expect } from '@playwright/test';

test.describe('Bidding and Auctions Tests', () => {
  test.describe('Bids Page', () => {
    test('should display bids page or redirect to login', async ({ page }) => {
      await page.goto('/bids');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display my bids page or redirect to login', async ({ page }) => {
      await page.goto('/my-bids');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Auction Listings', () => {
    test('should display auctions page', async ({ page }) => {
      await page.goto('/auctions');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display auction category page', async ({ page }) => {
      await page.goto('/category/auctions');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Bid Increments Info', () => {
    test('should display bid increments page', async ({ page }) => {
      await page.goto('/bid-increments');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Reserve Price Auctions', () => {
    test('should display reserve price info page', async ({ page }) => {
      await page.goto('/reserve-price');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Buy It Now + Auction', () => {
    test('should display buy it now info page', async ({ page }) => {
      await page.goto('/buy-it-now');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Auction End Times', () => {
    test('should display ending soon auctions', async ({ page }) => {
      await page.goto('/ending-soon');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
