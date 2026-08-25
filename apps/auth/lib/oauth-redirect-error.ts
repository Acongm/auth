export type OAuthRedirectError = {
  error: string | null;
  code: string | null;
  description: string | null;
};

export type OAuthProvider = 'google' | 'github';
export type AuthMode = 'signin' | 'signup';

export const IDENTITY_CONFLICT_SESSION_KEY = 'acongm.identity-conflict';
export const PENDING_OAUTH_PROVIDER_KEY = 'acongm.pending-oauth-provider';

type LocationLike = {
  hash?: string;
  search?: string;
};

function searchParamsFrom(search: string | undefined): URLSearchParams {
  if (!search) return new URLSearchParams();
  const value = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(value);
}

export function resolveLoginModeFromSearch(search: string | undefined): AuthMode {
  return searchParamsFrom(search).get('mode') === 'signup' ? 'signup' : 'signin';
}

export function parseOAuthProvider(value: string | null | undefined): OAuthProvider | null {
  return value === 'google' || value === 'github' ? value : null;
}

export function readOAuthProviderFromLocation(location: LocationLike): OAuthProvider | null {
  const search = searchParamsFrom(location.search);
  return (
    parseOAuthProvider(search.get('provider')) ||
    parseOAuthProvider(searchParamsFrom(location.hash?.replace(/^#/, '')).get('provider'))
  );
}

export function rememberPendingOAuthProvider(provider: OAuthProvider) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PENDING_OAUTH_PROVIDER_KEY, provider);
}

export function readPendingOAuthProvider(): OAuthProvider | null {
  if (typeof sessionStorage === 'undefined') return null;
  return parseOAuthProvider(sessionStorage.getItem(PENDING_OAUTH_PROVIDER_KEY));
}

export function clearPendingOAuthProvider() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PENDING_OAUTH_PROVIDER_KEY);
}

export function markIdentityConflictSession() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(IDENTITY_CONFLICT_SESSION_KEY, '1');
}

export function hasIdentityConflictSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(IDENTITY_CONFLICT_SESSION_KEY) === '1';
}

export function clearIdentityConflictSession() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(IDENTITY_CONFLICT_SESSION_KEY);
}

export function resolveInitialLoginMode(location: LocationLike): AuthMode {
  const redirectError = readOAuthRedirectError(location);
  if (isIdentityAlreadyLinked(redirectError) || hasIdentityConflictSession()) {
    return 'signin';
  }
  return resolveLoginModeFromSearch(location.search);
}

function queryFrom(value: string | undefined, prefix: '#' | '?'): string {
  if (!value) return '';
  return value.startsWith(prefix) ? value.slice(1) : value;
}

export function readOAuthRedirectError(
  location: LocationLike,
): OAuthRedirectError | null {
  const hash = new URLSearchParams(queryFrom(location.hash, '#'));
  const search = new URLSearchParams(queryFrom(location.search, '?'));
  const error = hash.get('error') || search.get('error');
  const code = hash.get('error_code') || search.get('error_code');
  const description =
    hash.get('error_description') || search.get('error_description');

  if (!error && !code && !description) {
    return null;
  }

  return { error, code, description };
}

export function isIdentityAlreadyLinked(
  error: OAuthRedirectError | null,
): boolean {
  if (!error) return false;
  const blob = [error.code, error.error, error.description]
    .filter(Boolean)
    .join(' ');
  return /identity_already_exists|already linked to another user|identity is already linked/i.test(
    blob,
  );
}

export function messageForOAuthRedirectError(
  error: OAuthRedirectError | null,
): string {
  if (!error) return '登录失败，请重试。';
  if (isIdentityAlreadyLinked(error)) {
    return '该第三方身份已经属于另一个账号。当前访客会话不会自动合并到已有账号；已切换到「登录」，将用该第三方进入已有账号。';
  }
  if (error.code === 'oauth_callback_failed' || error.error === 'oauth_callback_failed') {
    return '第三方登录回调失败，请再试一次。';
  }
  return error.description?.replace(/\+/g, ' ') || error.error || '登录失败，请重试。';
}

export function shouldUpgradeAuthHostToHttps(location: {
  hostname: string;
  protocol: string;
}): boolean {
  return location.hostname === 'auth.acongm.com' && location.protocol === 'http:';
}

/** Drop OAuth error fragments; identity conflicts keep sign-in mode but drop link retry. */
export function nextLoginUrlAfterOAuthError(href: string, identityLinked: boolean): string {
  const url = new URL(href);
  url.hash = '';
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  if (identityLinked) {
    url.searchParams.set('mode', 'signin');
    url.searchParams.delete('provider');
  }
  return `${url.pathname}${url.search}`;
}

export function shouldDefaultAnonymousToSignup(
  locationSearch: string | undefined,
  options?: { identityConflict?: boolean; guest?: boolean },
): boolean {
  if (!options?.guest || options.identityConflict) return false;
  return resolveLoginModeFromSearch(locationSearch) !== 'signin';
}
