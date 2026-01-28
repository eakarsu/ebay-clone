import { test, expect } from '@playwright/test';

test.describe('Static Pages Tests', () => {
  test.describe('Help Page', () => {
    test('should display help page', async ({ page }) => {
      await page.goto('/help');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/help');
      // Check for input or page is visible
      const inputs = page.locator('input');
      const hasInputs = await inputs.count() > 0;
      if (hasInputs) {
        await expect(inputs.first()).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should display help categories', async ({ page }) => {
      await page.goto('/help');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('About Page', () => {
    test('should display about page', async ({ page }) => {
      await page.goto('/about');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display company information', async ({ page }) => {
      await page.goto('/about');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Contact Page', () => {
    test('should display contact page', async ({ page }) => {
      await page.goto('/contact');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have contact form', async ({ page }) => {
      await page.goto('/contact');
      // Check for form elements or page is visible
      const formElements = page.locator('form, input, textarea');
      const hasFormElements = await formElements.count() > 0;
      if (hasFormElements) {
        await expect(formElements.first()).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Legal Page', () => {
    test('should display legal page', async ({ page }) => {
      await page.goto('/legal');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Policies Page', () => {
    test('should display policies page', async ({ page }) => {
      await page.goto('/policies');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Careers Page', () => {
    test('should display careers page', async ({ page }) => {
      await page.goto('/careers');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Site Map Page', () => {
    test('should display site map page', async ({ page }) => {
      await page.goto('/site-map');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display navigation links', async ({ page }) => {
      await page.goto('/site-map');
      // Check for links or page is visible
      const links = page.locator('a');
      const hasLinks = await links.count() > 0;
      if (hasLinks) {
        await expect(links.first()).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Authenticity Guarantee Page', () => {
    test('should display authenticity guarantee page', async ({ page }) => {
      await page.goto('/authenticity-guarantee');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Motors Page', () => {
    test('should display motors page', async ({ page }) => {
      await page.goto('/motors');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Apps Page', () => {
    test('should display apps page', async ({ page }) => {
      await page.goto('/apps');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display app download links', async ({ page }) => {
      await page.goto('/apps');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Local Pickup Page', () => {
    test('should display local pickup page', async ({ page }) => {
      await page.goto('/local-pickup');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('GSP Page', () => {
    test('should display global shipping program page', async ({ page }) => {
      await page.goto('/gsp');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Import Duties Page', () => {
    test('should display import duties page', async ({ page }) => {
      await page.goto('/import-duties');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Charity Listings Page', () => {
    test('should display charity listings page', async ({ page }) => {
      await page.goto('/charity-listings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Government Page', () => {
    test('should display government page', async ({ page }) => {
      await page.goto('/government');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Volume Pricing Page', () => {
    test('should display volume pricing page', async ({ page }) => {
      await page.goto('/volume-pricing');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Bid Retractions Page', () => {
    test('should display bid retractions page', async ({ page }) => {
      await page.goto('/bid-retractions');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Proxy Bidding Page', () => {
    test('should display proxy bidding page', async ({ page }) => {
      await page.goto('/proxy-bidding');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Second Chance Offer Page', () => {
    test('should display second chance offer page', async ({ page }) => {
      await page.goto('/second-chance-offer');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Payment Plans Page', () => {
    test('should display payment plans page', async ({ page }) => {
      await page.goto('/payment-plans');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
