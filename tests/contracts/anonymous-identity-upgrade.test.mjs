import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(path) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('auth-client keeps Supabase cookies shareable across acongm.com subdomains', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /NEXT_PUBLIC_AUTH_COOKIE_DOMAIN \?\? ['"]\.acongm\.com['"]/);
});

test('OAuth flow links an identity when the current session is anonymous', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /export async function startOAuthFlow/);
  assert.match(text, /client\.auth\.getSession\(\)/);
  assert.match(text, /if \(isAnonymousSession\(session\)\)/);
  assert.match(text, /await linkOAuthIdentity\(client, options\)/);
  assert.match(text, /return ['"]link-anonymous['"]/);
});

test('OAuth flow preserves ordinary sign-in for non-anonymous sessions', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /await signInWithOAuth\(client, options\)/);
  assert.match(text, /return ['"]sign-in['"]/);
});

test('identity linking uses the existing callback redirect and does not invent a second callback', () => {
  const client = source('packages/auth-client/src/client.ts');
  const form = source('apps/auth/components/login-form.tsx');
  const callback = source('apps/auth/app/callback/route.ts');

  assert.match(client, /client\.auth\.linkIdentity/);
  assert.match(client, /redirectTo: options\.redirectTo/);
  assert.match(form, /startOAuthFlow\(client, \{ provider, redirectTo: callbackUrl \}\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
});

test('login form does not directly call signInWithOAuth for social buttons', () => {
  const text = source('apps/auth/components/login-form.tsx');
  assert.doesNotMatch(text, /\bsignInWithOAuth\s*\(/);
  assert.match(text, /await startOAuthFlow\(client/);
});

test('email password flow refuses to silently replace an anonymous auth.uid', () => {
  const text = source('apps/auth/components/login-form.tsx');
  assert.match(text, /protectAnonymousEmailIdentity/);
  assert.match(text, /if \(isAnonymousSession\(session\)\)/);
  assert.match(text, /await protectAnonymousEmailIdentity\(client\)/);
  assert.match(text, /避免切换 auth\.uid\(\) 后聊天记录消失/);
});

test('identity conflicts are surfaced instead of silently merging ownership', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /identity\.\*already\.\*exists\|already\.\*linked\|identity\.\*taken/i);
  assert.match(text, /不会自动合并到已有账号/);
});

test.todo('live Supabase project has Manual Linking enabled before rollout');
test.todo('OAuth anonymous upgrade is verified to preserve the exact auth.uid end-to-end');
test.todo('email/password anonymous upgrade has an explicit same-uid verification flow');
test.todo('signing an anonymous user into an existing account has an explicit chat merge policy');
