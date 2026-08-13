import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const hooks = read('packages/auth-client/src/hooks.tsx');
const index = read('packages/auth-client/src/index.ts');
const client = read('packages/auth-client/src/client.ts');
const status = read('packages/auth-client/src/session-status.ts');
const account = read('apps/auth/components/account-profile-form.tsx');

test('session status machine covers restoring / anonymous / authenticated / error', () => {
  assert.match(status, /export type AuthSessionStatus/);
  assert.match(status, /'restoring'/);
  assert.match(status, /'anonymous'/);
  assert.match(status, /'authenticated'/);
  assert.match(status, /'unauthenticated'/);
  assert.match(status, /'error'/);
  assert.match(status, /if \(!input\.configured\) return 'unauthenticated'/);
  assert.match(status, /if \(input\.loading\) return 'restoring'/);
  assert.match(status, /if \(input\.error\) return 'error'/);
  assert.match(status, /if \(!input\.hasSession\) return 'unauthenticated'/);
  assert.match(status, /if \(input\.isAnonymous\) return 'anonymous'/);
  assert.match(status, /return 'authenticated'/);
});

test('useSession exposes status and retry instead of forcing consumers to guess null', () => {
  assert.match(hooks, /const status = resolveAuthSessionStatus/);
  assert.match(hooks, /userId: session\?\.user\?\.id/);
  assert.match(hooks, /accessToken: session\?\.access_token/);
  assert.match(hooks, /isAnonymous,/);
  assert.match(hooks, /retry,/);
  assert.match(index, /resolveAuthSessionStatus/);
  assert.match(index, /AuthSessionStatus/);
});

test('anonymous bootstrap is opt-in; Auth account pages do not auto-create guests', () => {
  assert.match(hooks, /ensureAnonymous \?/);
  assert.doesNotMatch(account, /ensureAnonymous:\s*true/);
});

test('signOut forwards Supabase local/global/others scope', () => {
  assert.match(client, /scope\?: 'local' \| 'global' \| 'others'/);
  assert.match(client, /client\.auth\.signOut\(/);
});
