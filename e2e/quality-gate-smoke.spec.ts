import { expect, test } from '@playwright/test';
import {
  MOCK_USER_EMAIL,
  installAuthQualityGateMocks,
} from './fixtures/mock-quality-gate';

test.describe('Platform v2 auth quality gate browser smoke (#37)', () => {
  test('login chrome exposes email and OAuth providers', async ({ page }) => {
    await installAuthQualityGateMocks(page, { kind: 'none' });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /登录到 Acongm|注册 Acongm/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel('邮箱')).toBeVisible();
    await expect(page.getByLabel('密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '使用 GitHub 登录' })).toBeVisible();
    await expect(page.getByRole('button', { name: '使用 Google 登录' })).toBeVisible();
  });

  test('anonymous account visitors cannot edit profile', async ({ page }) => {
    await installAuthQualityGateMocks(page, { kind: 'anonymous' });
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: '当前是访客身份' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: '登录或注册' })).toBeVisible();
    await expect(page.getByLabel('Display name')).toHaveCount(0);
  });

  test('authenticated account can load and save profile plus settings', async ({
    page,
  }) => {
    await installAuthQualityGateMocks(page, { kind: 'authenticated' });
    await page.goto('/account#settings');

    await expect(page.getByText(MOCK_USER_EMAIL)).toBeVisible({ timeout: 30_000 });
    const displayName = page.getByLabel('Display name');
    await expect(displayName).toBeVisible();
    await displayName.fill('Quality Gate Edited');
    await page.getByRole('button', { name: '保存资料' }).click();
    await expect(page.getByText('已保存。')).toBeVisible();

    await page.locator('#account-default-prompt').fill('回答尽量简洁。');
    await page.getByRole('button', { name: '保存偏好' }).click();
    await expect(page.locator('#account-default-prompt')).toHaveValue('回答尽量简洁。');
  });
});
