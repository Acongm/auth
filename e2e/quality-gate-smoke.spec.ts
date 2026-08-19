import { expect, test } from '@playwright/test';
import {
  MOCK_DISPLAY_NAME,
  injectMockPermanentSession,
  installQualityGateMocks,
} from './fixtures/mock-quality-gate';

test.describe('Platform v2 auth quality gate browser smoke (#37)', () => {
  test('login chrome shows email and social sign-in', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: '登录到 Acongm' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: '邮箱登录' })).toBeVisible();
    await expect(page.getByRole('button', { name: '使用 GitHub 登录' })).toBeVisible();
    await expect(page.getByRole('button', { name: '使用 Google 登录' })).toBeVisible();
  });

  test('account page asks guests to sign in', async ({ page }) => {
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: '账号与应用资料' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: '当前是访客身份' })).toBeVisible();
    await expect(page.getByRole('button', { name: '登录或注册' })).toBeVisible();
  });

  test('signed-in account shows userInfo and settings', async ({ page, baseURL }) => {
    await installQualityGateMocks(page);
    await injectMockPermanentSession(page, baseURL ?? 'http://127.0.0.1:3100');
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: '身份信息' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(MOCK_DISPLAY_NAME).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '界面偏好' })).toBeVisible();
    await expect(page.locator('#account-default-model')).toHaveValue(
      'deepseek-v4-flash',
    );
    await expect(page.getByRole('button', { name: '登录或注册' })).toHaveCount(0);

    await page.locator('#account-default-prompt').fill('回答尽量简洁。');
    await page.getByRole('button', { name: '保存偏好' }).click();
    await expect(page.getByText('已保存。')).toBeVisible();
  });
});
