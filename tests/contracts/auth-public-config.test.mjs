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
  assert.match(client, /https:\/\/auth\.acongm\.com\/api\/auth\/public-config/);
  assert.match(client, /https:\/\/api\.acongm\.com\/api\/auth\/public-config/);
  assert.match(client, /knownPublicConfigForHost/);
  assert.match(hooks, /await loadAuthPublicConfig\(\)/);
  assert.match(hooks, /getAuthSession/);
  assert.match(index, /loadAuthPublicConfig/);
  assert.match(index, /getAuthSession/);
});

test('missing anonymous session is not a hard error', () => {
  const hooks = source('packages/auth-client/src/hooks.tsx');
  assert.doesNotMatch(hooks, /无法准备访客会话，请重试/);
});

test('known acongm public config is host-scoped', () => {
  const fallback = source('packages/auth-client/src/acongm-public-config.ts');
  assert.match(fallback, /export function knownPublicConfigForHost/);
  assert.match(fallback, /hostname\.endsWith\('\.acongm\.com'\)/);
});

test('auth public-config prefers local NEXT_PUBLIC supabase env over API proxy', () => {
  const route = source('apps/auth/app/api/auth/public-config/route.ts');
  assert.match(route, /getSupabasePublicEnv/);
  assert.match(route, /source: 'local-env'/);
});

test('authenticated chrome prefers userInfo name/avatar and keeps a logout menu', () => {
  const button = source('packages/auth-client/src/AuthAccountButton.tsx');
  assert.match(button, /userInfo\.displayName/);
  assert.match(button, /userInfo\.avatarUrl/);
  assert.match(button, /userInfo\.isAnonymous && sessionAnonymous/);
  assert.match(button, /AuthAccountMenu/);
  assert.match(button, /onLogout=\{handleLogout\}/);
});
