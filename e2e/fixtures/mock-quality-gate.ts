import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
export const MOCK_ANON_KEY = 'mock-anon-key';
export const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
export const MOCK_ACCESS_TOKEN = 'mock-access-token-quality-gate';
export const MOCK_USER_EMAIL = 'qg@acongm.com';

export type AuthMockKind = 'none' | 'anonymous' | 'authenticated';

type AuthMockOptions = {
  kind?: AuthMockKind;
};

function nowIso(): string {
  return new Date().toISOString();
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function readJsonBody(route: Route): Record<string, unknown> {
  try {
    const body = route.request().postDataJSON();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function createSession(kind: Exclude<AuthMockKind, 'none'>) {
  const authenticated = kind === 'authenticated';
  return {
    access_token: MOCK_ACCESS_TOKEN,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: MOCK_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: authenticated ? MOCK_USER_EMAIL : '',
      phone: '',
      is_anonymous: !authenticated,
      app_metadata: { provider: authenticated ? 'email' : 'anonymous' },
      user_metadata: authenticated ? { display_name: 'Quality Gate User' } : {},
      identities: [],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  };
}

function createMe(kind: Exclude<AuthMockKind, 'none'>) {
  const authenticated = kind === 'authenticated';
  const profile = {
    id: MOCK_USER_ID,
    displayName: authenticated ? 'Quality Gate User' : null,
    display_name: authenticated ? 'Quality Gate User' : null,
    avatarUrl: null,
    avatar_url: null,
    preferences: {},
    createdAt: nowIso(),
    created_at: nowIso(),
    updatedAt: nowIso(),
    updated_at: nowIso(),
  };
  const settings = {
    language: 'zh-CN',
    theme: 'system',
    chat: { defaultModel: 'deepseek-v4-flash', defaultPrompt: '' },
    preferences: {},
    schemaVersion: 1,
  };
  return {
    id: MOCK_USER_ID,
    email: authenticated ? MOCK_USER_EMAIL : null,
    name: authenticated ? 'Quality Gate User' : null,
    role: 'viewer',
    tier: 'user',
    isAnonymous: !authenticated,
    profile,
    userInfo: {
      id: MOCK_USER_ID,
      displayName: authenticated ? 'Quality Gate User' : '访客',
      avatarUrl: null,
      email: authenticated ? MOCK_USER_EMAIL : null,
      accountLabel: authenticated ? MOCK_USER_EMAIL : '访客',
      role: 'viewer',
      tier: 'user',
      isAnonymous: !authenticated,
      source: 'profile',
    },
    settings,
  };
}

export async function installAuthQualityGateMocks(
  page: Page,
  options: AuthMockOptions = {},
) {
  const kind = options.kind ?? 'anonymous';
  const session = kind === 'none' ? null : createSession(kind);
  let me = kind === 'none' ? null : createMe(kind);

  await page.route('**/api/auth/public-config', (route) =>
    json(route, 200, {
      supabaseUrl: MOCK_SUPABASE_URL,
      supabaseAnonKey: MOCK_ANON_KEY,
    }),
  );

  await page.route('**/auth/v1/**', (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (!session) {
      if (url.includes('/auth/v1/user') && method === 'GET') {
        return json(route, 401, { message: 'no session' });
      }
      return json(route, 200, { session: null });
    }
    if (url.includes('/auth/v1/user') && method === 'GET') {
      return json(route, 200, session.user);
    }
    if (url.includes('/auth/v1/session') && method === 'GET') {
      return json(route, 200, { session });
    }
    if (url.includes('/auth/v1/token') && method === 'POST') {
      return json(route, 200, session);
    }
    return json(route, 200, {});
  });

  await page.route('**/api/user/**', (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/\/$/, '');
    const method = route.request().method();
    if (!me) {
      return json(route, 401, { message: 'unauthenticated' });
    }

    if (pathname.endsWith('/me') && method === 'GET') {
      return json(route, 200, me);
    }
    if (pathname.endsWith('/profile') && method === 'PATCH') {
      const body = readJsonBody(route);
      if (typeof body.displayName === 'string' || body.displayName === null) {
        me = {
          ...me,
          name: typeof body.displayName === 'string' ? body.displayName : me.name,
          profile: me.profile
            ? {
                ...me.profile,
                displayName:
                  typeof body.displayName === 'string' ? body.displayName : null,
                display_name:
                  typeof body.displayName === 'string' ? body.displayName : null,
              }
            : me.profile,
          userInfo: {
            ...me.userInfo,
            displayName:
              typeof body.displayName === 'string'
                ? body.displayName
                : me.userInfo.displayName,
          },
        };
      }
      return json(route, 200, { profile: me.profile, userInfo: me.userInfo });
    }
    if (pathname.endsWith('/settings') && method === 'GET') {
      return json(route, 200, me.settings);
    }
    if (pathname.endsWith('/settings') && method === 'PATCH') {
      const body = readJsonBody(route);
      const nextPrompt =
        body.defaultPrompt === null
          ? ''
          : typeof body.defaultPrompt === 'string'
            ? body.defaultPrompt
            : me.settings.chat.defaultPrompt;
      me = {
        ...me,
        settings: {
          ...me.settings,
          chat: { ...me.settings.chat, defaultPrompt: nextPrompt },
        },
      };
      return json(route, 200, { settings: me.settings, userInfo: me.userInfo });
    }
    return json(route, 404, { message: `unmocked user route: ${pathname}` });
  });

  if (!session) {
    return;
  }

  await page.context().addCookies([
    {
      name: 'sb-mock-supabase-auth-token',
      value: JSON.stringify(session),
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
