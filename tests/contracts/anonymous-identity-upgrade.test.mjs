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

test('OAuth signup links identity only when the current session is anonymous', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /export type OAuthIntent = ['"]sign-in['"] \| ['"]sign-up['"]/);
  assert.match(text, /options\.intent === ['"]sign-up['"] && isAnonymousSession\(session\)/);
  assert.match(text, /await linkOAuthIdentity\(client, authOptions\)/);
  assert.match(text, /return ['"]link-anonymous['"]/);
});

test('OAuth signin remains an explicit account switch even from an anonymous session', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /await signInWithOAuth\(client, authOptions\)/);
  assert.match(text, /return ['"]sign-in['"]/);
  assert.doesNotMatch(text, /if \(isAnonymousSession\(session\)\)\s*\{\s*await linkOAuthIdentity/);
});

test('login form passes the visible signin/signup intent into OAuth start', () => {
  const form = source('apps/auth/components/login-form.tsx');
  assert.match(
    form,
    /intent: mode === ["']signup["'] \? ["']sign-up["'] : ["']sign-in["']/,
  );
  assert.doesNotMatch(form, /\bsignInWithOAuth\s*\(/);
});

test('identity linking reuses the existing callback and does not invent a second callback', () => {
  const client = source('packages/auth-client/src/client.ts');
  const form = source('apps/auth/components/login-form.tsx');
  const callback = source('apps/auth/app/callback/route.ts');

  assert.match(client, /client\.auth\.linkIdentity/);
  assert.match(client, /redirectTo: options\.redirectTo/);
  assert.match(form, /redirectTo: callbackUrl/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
});

test('anonymous email signup is gated, while existing-account email signin stays allowed', () => {
  const form = source('apps/auth/components/login-form.tsx');
  assert.match(form, /async function protectAnonymousEmailSignup/);
  assert.match(form, /if \(isAnonymousSession\(session\)\)/);
  assert.match(
    form,
    /if \(mode === ["']signin["']\)[\s\S]*?await signInWithPassword\([\s\S]*?return;[\s\S]*?await protectAnonymousEmailSignup\(client\)/,
  );
  assert.match(form, /不会自动合并匿名聊天/);
});

test('identity conflicts surface instead of silently falling back or merging ownership', () => {
  const text = source('packages/auth-client/src/client.ts');
  assert.match(text, /identity\.\*already\.\*exists\|already\.\*linked\|identity\.\*taken/i);
  assert.match(text, /不会自动合并到已有账号/);
  assert.doesNotMatch(text, /catch[\s\S]*signInWithOAuth[\s\S]*linkOAuthIdentity/);
});

test('login copy makes existing-account identity switching explicit', () => {
  const form = source('apps/auth/components/login-form.tsx');
  assert.match(form, /登录已有账号会切换 auth\.uid\(\)/);
  assert.match(form, /Google \/ GitHub 注册会绑定到当前匿名身份并保留 auth\.uid\(\)/);
});

test.todo('live Supabase project has Manual Linking enabled before rollout');
test.todo('OAuth anonymous upgrade is verified to preserve the exact auth.uid end-to-end');
test.todo('email/password anonymous upgrade has an explicit same-uid verification flow in Auth #27');
test.todo('optional cross-account anonymous chat transfer has proof-bound merge semantics');
