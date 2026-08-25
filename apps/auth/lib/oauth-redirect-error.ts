export type OAuthRedirectError = {
  error: string | null;
  code: string | null;
  description: string | null;
};

type LocationLike = {
  hash?: string;
  search?: string;
};

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
    return '该第三方身份已经属于另一个账号。当前访客会话不会自动合并到已有账号；请切换到“登录”再进入已有账号。';
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

/** Drop OAuth error fragments and stop auto-retrying a failed anonymous link. */
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
