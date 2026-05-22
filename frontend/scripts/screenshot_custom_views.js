/**
 * Playwright script: log in, visit /custom-views, screenshot to /tmp/custom_ebay.png
 */
const { chromium } = require('@playwright/test');

const FE = process.env.FE_URL || 'http://localhost:3030';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[browser-error]', msg.text());
  });

  // Login
  await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('input[name="email"]', { timeout: 20000 });
  await page.fill('input[name="email"]', 'buyer@ebay.com');
  await page.fill('input[name="password"]', 'password123');
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);

  // Navigate to custom-views regardless of redirect outcome
  await page.goto(`${FE}/custom-views`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for our page testid to appear; tolerate API delay
  try {
    await page.waitForSelector('[data-testid="custom-views-page"]', { timeout: 20000 });
  } catch (e) {
    console.log('warn: page testid not found, continuing');
  }
  // Let chart components fetch
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/custom_ebay.png', fullPage: true });
  console.log('OK screenshot saved to /tmp/custom_ebay.png');

  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
