import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('AuthAccountMenu exposes account, settings anchor, and logout', () => {
  const menu = read('packages/auth-client/src/AuthAccountMenu.tsx');
  assert.match(menu, /AuthAccountMenu/);
  assert.match(menu, />\s*账号\s*</);
  assert.match(menu, />\s*设置\s*</);
  assert.match(menu, /#settings/);
  assert.match(menu, /退出登录/);
});

test('AuthAccountButton renders AuthAccountMenu for authenticated users', () => {
  const button = read('packages/auth-client/src/AuthAccountButton.tsx');
  assert.match(button, /AuthAccountMenu/);
  assert.match(button, /menuFooter/);
  assert.match(button, /onLogout=\{handleLogout\}/);
  assert.doesNotMatch(button, /menu\s*=\s*\{?\s*false/);
});
