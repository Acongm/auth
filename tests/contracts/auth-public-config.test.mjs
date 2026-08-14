import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(path) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('auth-client can load browser-safe supabase config from API when env is missing', () => {
  const client = source('packages/auth-client/src/client.ts');
  const hooks = source('packages/auth-client/src/hooks.tsx');
  const index = source('packages/auth-client/src/index.ts');

  assert.match(client, /export async function loadAuthPublicConfig/);
  assert.match(client, /\/api\/auth\/public-config/);
  assert.match(client, /https:\/\/api\.acongm\.com\/api\/auth\/public-config/);
  assert.match(hooks, /await loadAuthPublicConfig\(\)/);
  assert.match(index, /loadAuthPublicConfig/);
});

test('authenticated chrome prefers userInfo name/avatar and keeps a logout menu', () => {
  const button = source('packages/auth-client/src/AuthAccountButton.tsx');
  assert.match(button, /userInfo\.displayName/);
  assert.match(button, /userInfo\.avatarUrl/);
  assert.match(button, /userInfo\.isAnonymous && sessionAnonymous/);
  assert.match(button, /showMenu = menu \|\| variant === 'sidebar' \|\| variant === 'nav'/);
  assert.match(button, /AuthAccountMenu/);
});
