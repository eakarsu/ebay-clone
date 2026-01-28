import { defineConfig, devices } from '@playwright/test';
import { authenticator } from 'otplib';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

// Export TOTP helper for use in tests
export function generateTOTP(secret: string): string {
  return authenticator.generate(secret);
}

export function verifyTOTP(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}
