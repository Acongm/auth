import { defineConfig, devices } from '@playwright/test';

const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
const MOCK_ANON_KEY = 'mock-anon-key';

export default defineConfig({
  testDir: './e2e',
  testIgnore: /live-quality-gate\.spec\.ts|prod-cookie-quality-gate\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @acongm/config build && pnpm --filter @acongm/auth-app dev',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
      NEXT_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: MOCK_ANON_KEY,
      NEXT_PUBLIC_AUTH_URL: 'http://127.0.0.1:3100',
      NEXT_PUBLIC_AUTH_LOCAL: '1',
      USER_API_UPSTREAM_URL: 'http://127.0.0.1:3100/api/user',
      AUTH_SESSION_URL: 'http://127.0.0.1:3100/api/session',
    },
  },
});
