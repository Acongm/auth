import { expect, test } from '@playwright/test';
import {
  LIVE_ENABLED,
  injectProductionCookies,
  mintLiveUser,
} from './fixtures/live-session';

test.describe('Platform v2 production cookie browser (#37)', () => {
  test.skip(!LIVE_ENABLED, 'ACONGM_SUPABASE_ACCESS_TOKEN is not set');

  test('shared .acongm.com cookies unlock Auth, Chat, and Portal chrome', async ({
    page,
  }) => {
    const live = await mintLiveUser();
    try {
      await injectProductionCookies(page, live.session);

      await page.goto('https://auth.acongm.com/account');
      await expect(page.getByRole('heading', { name: '身份信息' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/Quality Gate Live|qg-/).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('heading', { name: '界面偏好' })).toBeVisible();
      await expect(page.getByRole('button', { name: '登录或注册' })).toHaveCount(0);
      await page.screenshot({
        path: '/opt/cursor/artifacts/auth_account_prod_cookie.png',
        animations: 'disabled',
      });

      await page.goto('https://chat.acongm.com/');
      await expect(
        page.getByRole('button', { name: /Quality Gate Live|qg-/ }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: '登录' })).toHaveCount(0);
      await page.screenshot({
        path: '/opt/cursor/artifacts/chat_chrome_prod_cookie.png',
        animations: 'disabled',
      });

      await page.goto('https://www.acongm.com/');
      await expect(
        page.getByRole('button', { name: /Quality Gate Live|qg-/ }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: '登录' })).toHaveCount(0);
      await page.screenshot({
        path: '/opt/cursor/artifacts/portal_topbar_prod_cookie.png',
        animations: 'disabled',
      });

      await page.goto('https://www.acongm.com/docs/core');
      await expect(
        page.getByRole('button', { name: /AI 阅读助手|AI 助手/ }),
      ).toBeVisible({ timeout: 30_000 });
    } finally {
      await live.cleanup();
    }
  });
});
