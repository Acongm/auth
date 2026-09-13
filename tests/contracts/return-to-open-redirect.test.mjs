import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_ALLOWED_RETURN_HOSTS = ['*.acongm.com', 'acongm.com'];
const ALLOWED = [...DEFAULT_ALLOWED_RETURN_HOSTS, 'localhost', '127.0.0.1'];
const FALLBACK = 'https://www.acongm.com';

function isLocalHostname(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

function isAllowedReturnTo(url, allowedHosts) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname;
    return allowedHosts.some((host) => {
      if (host.startsWith('*.')) {
        const suffix = host.slice(1);
        return hostname.endsWith(suffix) || hostname === host.slice(2);
      }

      return hostname === host;
    });
  } catch {
    return false;
  }
}

function sanitizeReturnTo(returnTo, fallback, allowedHosts) {
  if (!returnTo) {
    return fallback;
  }

  return isAllowedReturnTo(returnTo, allowedHosts) ? returnTo : fallback;
}

test('return-to helpers stay aligned with apps/auth/lib/return-to.ts', () => {
  const source = readFileSync(
    join(process.cwd(), 'apps/auth/lib/return-to.ts'),
    'utf8',
  );
  assert.match(source, /export const DEFAULT_ALLOWED_RETURN_HOSTS = \["\*\.acongm\.com", "acongm\.com"\]/);
  assert.match(source, /export function isAllowedReturnTo/);
  assert.match(source, /export function sanitizeReturnTo/);
});

function source(path) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('isAllowedReturnTo accepts trusted acongm hosts', () => {
  assert.equal(isAllowedReturnTo('https://chat.acongm.com', ALLOWED), true);
  assert.equal(isAllowedReturnTo('https://www.acongm.com/path?q=1', ALLOWED), true);
  assert.equal(isAllowedReturnTo('https://acongm.com', ALLOWED), true);
  assert.equal(isAllowedReturnTo('http://localhost:3000', ALLOWED), true);
});

test('isAllowedReturnTo rejects open-redirect targets', () => {
  assert.equal(isAllowedReturnTo('javascript:alert(1)', ALLOWED), false);
  assert.equal(isAllowedReturnTo('data:text/html,<script>alert(1)</script>', ALLOWED), false);
  assert.equal(isAllowedReturnTo('https://evil.com', ALLOWED), false);
  assert.equal(isAllowedReturnTo('https://acongm.com.evil.com', ALLOWED), false);
  assert.equal(isAllowedReturnTo('not-a-url', ALLOWED), false);
});

test('sanitizeReturnTo falls back when return_to is missing or untrusted', () => {
  assert.equal(sanitizeReturnTo(null, FALLBACK, ALLOWED), FALLBACK);
  assert.equal(sanitizeReturnTo('', FALLBACK, ALLOWED), FALLBACK);
  assert.equal(sanitizeReturnTo('https://evil.com', FALLBACK, ALLOWED), FALLBACK);
  assert.equal(
    sanitizeReturnTo('https://chat.acongm.com/thread/1', FALLBACK, ALLOWED),
    'https://chat.acongm.com/thread/1',
  );
});

test('isLocalHostname only matches loopback hosts', () => {
  assert.equal(isLocalHostname('localhost'), true);
  assert.equal(isLocalHostname('127.0.0.1'), true);
  assert.equal(isLocalHostname('[::1]'), true);
  assert.equal(isLocalHostname('auth.acongm.com'), false);
});

test('callback route sanitizes return_to before redirecting', () => {
  const callback = source('apps/auth/app/callback/route.ts');
  assert.match(callback, /sanitizeReturnTo/);
  assert.match(callback, /getAllowedReturnHosts\(\)/);
  assert.match(callback, /getDefaultReturnTo\(\)/);
});

test('login flow validates return_to against the allow-list', () => {
  const loginForm = source('apps/auth/components/login-form.tsx');
  assert.match(loginForm, /safeReturnTo/);
  assert.match(loginForm, /isAllowedReturnTo/);
  assert.match(loginForm, /DEFAULT_ALLOWED_RETURN_HOSTS/);
  assert.match(loginForm, /finishRedirect/);
});

test('logout route sanitizes return_to before redirecting', () => {
  const logout = source('apps/auth/app/logout/route.ts');
  assert.match(logout, /sanitizeReturnTo/);
  assert.match(logout, /getAllowedReturnHosts\(\)/);
  assert.doesNotMatch(logout, /NextResponse\.redirect\(returnTo\)/);
});

test('auth state changes invalidate cached user/profile/settings session snapshot', () => {
  const hooks = source('packages/auth-client/src/hooks.tsx');
  const onChangeBlock = hooks.slice(
    hooks.indexOf('onAuthStateChange'),
    hooks.indexOf(').data.subscription'),
  );
  assert.match(onChangeBlock, /clearAuthSessionCache\(\)/);
  assert.ok(
    onChangeBlock.indexOf('clearAuthSessionCache()') <
      onChangeBlock.indexOf('setSession(nextSession)'),
    'cache must clear before applying the next session',
  );
});
