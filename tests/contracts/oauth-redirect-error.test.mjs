import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(path) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const USER_HASH =
  '#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user&sb=';

test('login form reads OAuth errors from the URL hash, not only search params', () => {
  const form = source('apps/auth/components/login-form.tsx');
  const helper = source('apps/auth/lib/oauth-redirect-error.ts');

  assert.match(helper, /error_code/);
  assert.match(helper, /identity_already_exists/);
  assert.match(form, /readOAuthRedirectError/);
  assert.match(form, /window\.location/);
  assert.doesNotMatch(form, /useSearchParams\(\)[\s\S]*setError\([\s\S]*hash/);
});

test('identity_already_exists switches the visible mode to sign-in', () => {
  const form = source('apps/auth/components/login-form.tsx');
  assert.match(form, /isIdentityAlreadyLinked/);
  assert.match(form, /setMode\(["']signin["']\)/);
  assert.match(form, /resolveInitialLoginMode/);
  assert.match(form, /不会自动合并/);
});

test('identity conflict auto-retries OAuth with sign-in intent instead of linkIdentity', () => {
  const form = source('apps/auth/components/login-form.tsx');
  const helper = source('apps/auth/lib/oauth-redirect-error.ts');
  assert.match(form, /runOAuth\(provider, ["']sign-in["']\)/);
  assert.match(form, /正在切换到已有账号登录/);
  assert.match(form, /signInRetryStartedRef/);
  assert.match(helper, /PENDING_OAUTH_PROVIDER_KEY/);
  assert.match(helper, /readOAuthProviderFromLocation/);
});

test('production OAuth callback stays on https even if the user opened http://auth.acongm.com', () => {
  const form = source('apps/auth/components/login-form.tsx');
  assert.match(form, /https:\/\/auth\.acongm\.com\/callback/);
  assert.match(form, /host === ["']auth\.acongm\.com["']/);
});

test('oauth-redirect-error parses the production Google identity_already_exists hash', () => {
  const helper = source('apps/auth/lib/oauth-redirect-error.ts');
  const hash = new URLSearchParams(USER_HASH.slice(1));

  assert.equal(hash.get('error_code'), 'identity_already_exists');
  assert.equal(hash.get('error'), 'server_error');
  assert.match(hash.get('error_description') ?? '', /already linked to another user/i);
  assert.match(helper, /hash\.get\(['"]error_code['"]\) \|\| search\.get\(['"]error_code['"]\)/);
  assert.match(helper, /identity_already_exists\|already linked to another user/i);
  assert.match(helper, /不会自动合并到已有账号/);
  assert.match(helper, /已切换到「登录」/);
});

test('identity conflict login URL forces sign-in and drops auto-start provider', () => {
  const helper = source('apps/auth/lib/oauth-redirect-error.ts');
  const href = `https://auth.acongm.com/login?mode=signup&provider=google&return_to=https%3A%2F%2Fchat.acongm.com${USER_HASH}`;
  const url = new URL(href);
  url.hash = '';
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  url.searchParams.set('mode', 'signin');
  url.searchParams.delete('provider');

  assert.equal(`${url.pathname}${url.search}`, '/login?mode=signin&return_to=https%3A%2F%2Fchat.acongm.com');
  assert.match(helper, /searchParams\.set\(['"]mode['"], ['"]signin['"]\)/);
  assert.match(helper, /searchParams\.delete\(['"]provider['"]\)/);
  assert.match(helper, /hostname === ['"]auth\.acongm\.com['"] && location\.protocol === ['"]http:['"]/);
});

test('identity conflict does not flip anonymous visitors back to signup or auto-start OAuth', () => {
  const form = source('apps/auth/components/login-form.tsx');
  const helper = source('apps/auth/lib/oauth-redirect-error.ts');
  assert.match(form, /identityConflictRef/);
  assert.match(form, /autoOauthStartedRef/);
  assert.match(form, /identityConflictRef\.current/);
  assert.match(form, /shouldUpgradeAuthHostToHttps/);
  assert.match(form, /nextLoginUrlAfterOAuthError/);
  assert.match(form, /shouldDefaultAnonymousToSignup/);
  assert.match(form, /window\.location\.search/);
  assert.match(helper, /shouldDefaultAnonymousToSignup/);
  assert.match(form, /尚未登录到已有账号/);
  assert.doesNotMatch(
    form,
    /readOAuthRedirectError\(\{\s*hash:\s*[""],\s*search:\s*[""],\s*\}\)/,
  );
});
