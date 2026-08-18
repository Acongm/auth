import { expect, test, type Page } from '@playwright/test';
import { installQualityGateMocks } from './fixtures/mock-quality-gate';

async function signInAuthenticatedUser(page: Page) {
  await page.goto('/login?return_to=http%3A%2F%2Flocalhost%3A3100%2Faccount');
  await page.getByLabel('邮箱').fill('quality-gate@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '邮箱登录' }).click();
  await expect(page.getByRole('heading', { name: '账号与应用资料' })).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('Platform v2 quality gate browser smoke (#37)', () => {
  test('login page renders email and OAuth chrome', async ({ page }) => {
    await installQualityGateMocks(page);
    await page.goto('/login?return_to=http%3A%2F%2Flocalhost%3A3100%2Faccount');

    await expect(page.getByRole('heading', { name: '登录到 Acongm' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel('邮箱')).toBeVisible();
    await expect(page.getByLabel('密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '邮箱登录' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
    await expect(page.getByText('登录后返回：')).toBeVisible();
    await expect(page.getByText('http://localhost:3100/account')).toBeVisible();
  });

  test('account page shows guest state for anonymous sessions', async ({ page }) => {
    await installQualityGateMocks(page, { session: 'anonymous' });
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: '当前是访客身份' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: '登录或注册' })).toBeVisible();
  });

  test('account page loads identity and settings for authenticated users', async ({
    page,
  }) => {
    await installQualityGateMocks(page, { session: 'authenticated' });
    await signInAuthenticatedUser(page);

    await expect(page.getByRole('heading', { name: '身份信息' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('quality-gate@example.com')).toBeVisible();
    await expect(page.getByText('Quality Gate User')).toBeVisible();
    await expect(page.locator('#settings')).toBeVisible();
    await expect(page.getByLabel('Language')).toHaveValue('zh-CN');
    await expect(page.locator('#account-default-model')).toBeVisible();
    await expect(page.locator('#account-default-prompt')).toBeVisible();
  });

  test('account page can save profile and settings', async ({ page }) => {
    await installQualityGateMocks(page, { session: 'authenticated' });
    await signInAuthenticatedUser(page);
    await page.goto('/account#settings');

    const displayNameInput = page.getByLabel('Display name');
    await expect(displayNameInput).toBeVisible({ timeout: 30_000 });
    await displayNameInput.fill('Updated Gate User');
    await page.getByRole('button', { name: '保存资料' }).click();
    await expect(page.getByText('已保存。')).toBeVisible();

    await page.getByLabel('Language').fill('en-US');
    await page.locator('#account-default-model').fill('deepseek-v4-flash');
    await page.locator('#account-default-prompt').fill('回答尽量简洁。');
    await page.getByRole('button', { name: '添加技能' }).click();
    await page.getByLabel('技能名称').fill('code-review');
    await page.getByLabel('技能内容').fill('先核对测试再改代码。');
    await page.getByRole('button', { name: '保存偏好' }).click();
    await expect(page.getByText('已保存。')).toBeVisible();
    await expect(page.getByLabel('Language')).toHaveValue('en-US');
    await expect(page.locator('#account-default-model')).toHaveValue('deepseek-v4-flash');
    await expect(page.locator('#account-default-prompt')).toHaveValue('回答尽量简洁。');
    await expect(page.getByLabel('技能名称')).toHaveValue('code-review');
    await expect(page.getByLabel('技能内容')).toHaveValue('先核对测试再改代码。');
  });
});
