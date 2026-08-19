import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /prod-cookie-quality-gate\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'https://auth.acongm.com',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
