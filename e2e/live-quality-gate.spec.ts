import { expect, test } from '@playwright/test';
import { LIVE_ENABLED, mintLiveUser } from './fixtures/live-session';

test.describe('Platform v2 live JWT browser smoke (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('logs in with a real JWT and shows Account identity', async ({ page }) => {
    const live = await mintLiveUser();
    try {
      await page.goto(
        '/login?return_to=http%3A%2F%2Flocalhost%3A3110%2Faccount',
      );
      await page.getByLabel('邮箱').fill(live.user.email);
      await page.getByLabel('密码').fill(live.user.password);
      await page.getByRole('button', { name: '邮箱登录' }).click();

      await expect(page.getByRole('heading', { name: '身份信息' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(live.user.email)).toBeVisible();
      await expect(page.locator('#settings')).toBeVisible();
    } finally {
      await live.cleanup();
    }
  });
});
