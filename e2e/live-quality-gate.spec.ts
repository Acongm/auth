import { expect, test } from '@playwright/test';
import {
  LIVE_ENABLED,
  injectSupabaseSession,
  mintLiveUser,
} from './fixtures/live-session';

test.describe('Platform v2 auth live JWT browser smoke (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('shows authenticated account chrome', async ({ page, baseURL }) => {
    const live = await mintLiveUser();
    try {
      await injectSupabaseSession(page, live.session, baseURL ?? 'http://127.0.0.1:3110');
      await page.goto('/account');
      await expect(page.getByText(live.user.email)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByLabel('Display name')).toBeVisible();
      await expect(page.getByRole('heading', { name: '当前是访客身份' })).toHaveCount(0);
    } finally {
      await live.cleanup();
    }
  });
});
