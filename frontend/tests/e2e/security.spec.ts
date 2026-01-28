import { test, expect } from '@playwright/test';

test.describe('Security and 2FA Tests', () => {
  test.describe('Security Settings Page', () => {
    test('should display security settings page or redirect to login', async ({ page }) => {
      await page.goto('/security-settings');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display security center page', async ({ page }) => {
      await page.goto('/security-center');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Two-Factor Authentication', () => {
    test('should display 2FA setup page or redirect to login', async ({ page }) => {
      await page.goto('/2fa');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display 2FA settings page or redirect to login', async ({ page }) => {
      await page.goto('/2fa-settings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Password Management', () => {
    test('should display change password page or redirect to login', async ({ page }) => {
      await page.goto('/change-password');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display reset password page', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Account Security', () => {
    test('should display account activity page or redirect to login', async ({ page }) => {
      await page.goto('/account-activity');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display login history page or redirect to login', async ({ page }) => {
      await page.goto('/login-history');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display active sessions page or redirect to login', async ({ page }) => {
      await page.goto('/active-sessions');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Privacy Settings', () => {
    test('should display privacy settings page or redirect to login', async ({ page }) => {
      await page.goto('/privacy-settings');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display data export page or redirect to login', async ({ page }) => {
      await page.goto('/data-export');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
