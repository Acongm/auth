import { expect, test } from '@playwright/test';
import {
  LIVE_ENABLED,
  injectSupabaseSession,
  mintLiveUser,
} from './fixtures/live-session';

test.describe('Platform v2 live JWT browser smoke (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('account chrome shows the live user and settings', async ({
    page,
    baseURL,
  }) => {
    const live = await mintLiveUser();
    try {
      await injectSupabaseSession(page, live.session, baseURL ?? 'http://127.0.0.1:3110');
      await page.goto('/account');

      await expect(page.getByRole('heading', { name: '身份信息' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        page.getByText(/Quality Gate Live|qg-/).first(),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('heading', { name: '界面偏好' })).toBeVisible();
      await expect(page.locator('#account-default-model')).toBeVisible();
      await expect(page.getByRole('button', { name: '登录或注册' })).toHaveCount(0);
      await page.screenshot({
        path: '/opt/cursor/artifacts/auth_account_live_jwt.png',
        animations: 'disabled',
      });
    } finally {
      await live.cleanup();
    }
  });
});
