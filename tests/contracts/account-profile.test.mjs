import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const form = read('apps/auth/components/account-profile-form.tsx');
const bff = read('apps/auth/app/api/user/[[...path]]/route.ts');
const profileClient = read('packages/auth-client/src/profile.ts');

test('Account reads identity/profile from /api/user/me with the Supabase access token', () => {
  assert.match(form, /fetch\('\/api\/user\/me'/);
  assert.match(form, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(form, /next\.profile\?\.display_name/);
  assert.match(form, /next\.profile\?\.avatar_url/);
  assert.match(form, /next\.profile\?\.preferences/);
});

test('Account writes only application profile fields to /api/user/profile', () => {
  assert.match(form, /fetch\('\/api\/user\/profile'/);
  assert.match(form, /displayName: displayName\.trim\(\) \|\| null/);
  assert.match(form, /avatarUrl: avatarUrl\.trim\(\) \|\| null/);
  assert.match(form, /preferences,/);
  assert.doesNotMatch(form, /body: JSON\.stringify\([^)]*(userId|role|tier|email)/s);
});

test('identity fields are rendered read-only rather than editable inputs', () => {
  assert.match(form, /User ID/);
  assert.match(form, /Email/);
  assert.match(form, /Role/);
  assert.match(form, /Tier/);
  assert.doesNotMatch(form, /setRole|setTier|setEmail|setUserId/);
});

test('preferences replacement semantics require a JSON object', () => {
  assert.match(form, /JSON\.parse\(preferencesText \|\| '\{\}'\)/);
  assert.match(form, /Array\.isArray\(parsed\)/);
  assert.match(form, /replacement semantics/);
});

test('User BFF forwards Authorization and fails safely on upstream outage', () => {
  assert.match(bff, /https:\/\/api\.acongm\.com\/api\/user/);
  assert.match(bff, /'authorization'/);
  assert.match(bff, /USER_UPSTREAM_UNREACHABLE/);
});

test('shared profile client cannot send identity/authorization fields', () => {
  assert.match(profileClient, /export type UpdateApplicationProfile/);
  assert.match(profileClient, /displayName\?: string \| null/);
  assert.match(profileClient, /avatarUrl\?: string \| null/);
  assert.match(profileClient, /preferences\?: Record<string, unknown>/);
  assert.doesNotMatch(profileClient, /(userId|email|role|tier)\?:/);
  assert.match(profileClient, /PROFILE_PATCH_EMPTY/);
});
