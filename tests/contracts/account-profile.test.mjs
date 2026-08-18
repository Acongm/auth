import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const form = read('apps/auth/components/account-profile-form.tsx');
const bff = read('apps/auth/app/api/user/[[...path]]/route.ts');
const profileClient = read('packages/auth-client/src/profile.ts');

function typeBlock(source, typeName) {
  const match = source.match(
    new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\};`),
  );
  assert.ok(match, `${typeName} type block not found`);
  return match[1];
}

test('Account reads identity/profile via auth-client getUserMe', () => {
  assert.match(form, /getUserMe/);
  assert.match(form, /from '@acongm\/auth-client'/);
  assert.match(form, /next\.profile\?\.displayName/);
  assert.match(form, /next\.profile\?\.avatarUrl/);
  assert.match(form, /next\.profile\?\.preferences/);
  assert.match(form, /next\.settings/);
  assert.match(form, /me\?\.userInfo/);
});

test('Account writes application profile via auth-client updateUserProfile', () => {
  assert.match(form, /updateUserProfile/);
  assert.match(form, /displayName: displayName\.trim\(\) \|\| null/);
  assert.match(form, /avatarUrl: avatarUrl\.trim\(\) \|\| null/);
  assert.match(form, /preferences,/);
  assert.match(form, /result\.userInfo/);
  assert.doesNotMatch(form, /fetch\('\/api\/user\/profile'/);
});

test('Account writes typed settings via auth-client updateUserSettings', () => {
  assert.match(form, /updateUserSettings/);
  assert.match(form, /language: language\.trim\(\)/);
  assert.match(form, /theme/);
  assert.match(form, /\/api\/user\/settings/);
});

test('Account settings form saves defaultModel/defaultPrompt and treats empty prompt as reset', () => {
  assert.match(form, /setDefaultModel/);
  assert.match(form, /setDefaultPrompt/);
  assert.match(form, /next\.settings\.chat/);
  assert.match(form, /defaultModel\.trim\(\)/);
  assert.match(form, /defaultPrompt: defaultPrompt\.trim\(\) \? defaultPrompt\.trim\(\) : null/);
  assert.match(form, /id="account-default-model"/);
  assert.match(form, /id="account-default-prompt"/);
  assert.match(form, /空则 reset/);
  assert.match(form, /skills: nextSkills.length \? nextSkills : null/);
  assert.match(form, /添加技能/);
  assert.match(form, /默认系统提示词/);
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

test('shared profile patch type cannot expose identity/authorization fields', () => {
  const writableProfile = typeBlock(profileClient, 'UpdateApplicationProfile');
  assert.match(writableProfile, /displayName\?: string \| null/);
  assert.match(writableProfile, /avatarUrl\?: string \| null/);
  assert.match(writableProfile, /preferences\?: Record<string, unknown>/);
  assert.doesNotMatch(writableProfile, /(userId|email|role|tier)\??:/);
  assert.match(profileClient, /PROFILE_PATCH_EMPTY/);
  assert.match(profileClient, /export async function updateUserSettings/);
  assert.match(profileClient, /SettingsUpdateResult/);
});

test('auth-client settings contract accepts defaultModel/defaultPrompt and document fields', () => {
  const writableSettings = typeBlock(profileClient, 'UpdateUserSettings');
  assert.match(writableSettings, /defaultModel\?: string/);
  assert.match(writableSettings, /defaultPrompt\?: string \| null/);
  assert.match(writableSettings, /skills\?: AgentSkill\[\] \| null/);
  assert.match(profileClient, /schemaVersion\?: number/);
  assert.match(profileClient, /defaults\?: Record<string, unknown>/);
  assert.match(profileClient, /overrides\?: Record<string, unknown>/);
  assert.match(profileClient, /effective\?: Record<string, unknown>/);
  assert.match(profileClient, /body\.defaultModel = patch\.defaultModel/);
  assert.match(profileClient, /body\.defaultPrompt = patch\.defaultPrompt/);
  assert.match(profileClient, /body\.skills = patch\.skills/);
});
