import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
export const MOCK_ANON_KEY = 'mock-anon-key';
export const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
export const MOCK_ACCESS_TOKEN = 'mock-access-token-quality-gate';
export const MOCK_EMAIL = 'quality-gate@example.com';

type MockSessionMode = 'anonymous' | 'authenticated';

function buildSession(mode: MockSessionMode) {
  const isAnonymous = mode === 'anonymous';

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
      email: isAnonymous ? '' : MOCK_EMAIL,
      phone: '',
      is_anonymous: isAnonymous,
      app_metadata: { provider: isAnonymous ? 'anonymous' : 'email' },
      user_metadata: isAnonymous
        ? {}
        : { display_name: 'Quality Gate User' },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

function buildUserMe(mode: MockSessionMode) {
  const isAnonymous = mode === 'anonymous';

  return {
    id: MOCK_USER_ID,
    email: isAnonymous ? null : MOCK_EMAIL,
    name: isAnonymous ? null : 'Quality Gate User',
    role: isAnonymous ? 'anonymous' : 'viewer',
    tier: isAnonymous ? 'anon' : 'user',
    isAnonymous,
    profile: isAnonymous
      ? null
      : {
          id: MOCK_USER_ID,
          displayName: 'Quality Gate User',
          avatarUrl: null,
          preferences: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
    userInfo: {
      id: MOCK_USER_ID,
      displayName: isAnonymous ? '访客' : 'Quality Gate User',
      avatarUrl: null,
      email: isAnonymous ? null : MOCK_EMAIL,
      accountLabel: isAnonymous ? '访客' : MOCK_EMAIL,
      role: isAnonymous ? 'anonymous' : 'viewer',
      tier: isAnonymous ? 'anon' : 'user',
      isAnonymous,
      source: 'auth',
    },
    settings: {
      language: 'zh-CN',
      theme: 'system',
      chat: { defaultModel: '', defaultPrompt: '', skills: [] },
      preferences: {},
    },
  };
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function createHandlers(mode: MockSessionMode) {
  const session = buildSession(mode);
  const me = buildUserMe(mode);

  function fulfillSupabaseAuth(route: Route) {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/v1/signup') && method === 'POST') {
      return json(route, 200, session);
    }

    if (url.includes('/auth/v1/token') && method === 'POST') {
      return json(route, 200, session);
    }

    if (url.includes('/auth/v1/user') && method === 'GET') {
      return json(route, 200, session.user);
    }

    if (url.includes('/auth/v1/session') && method === 'GET') {
      return json(route, 200, { session });
    }

    return json(route, 200, {});
  }

  function fulfillAuthSession(route: Route) {
    const isAnonymous = mode === 'anonymous';

    return json(route, 200, {
      authenticated: !isAnonymous,
      configured: true,
      isAnonymous,
      user: {
        id: MOCK_USER_ID,
        email: isAnonymous ? null : MOCK_EMAIL,
        name: isAnonymous ? null : 'Quality Gate User',
        avatarUrl: null,
      },
      userInfo: me.userInfo,
      accessToken: MOCK_ACCESS_TOKEN,
    });
  }

  function fulfillPublicConfig(route: Route) {
    return json(route, 200, {
      supabaseUrl: MOCK_SUPABASE_URL,
      supabaseAnonKey: MOCK_ANON_KEY,
      configured: true,
      source: 'mock',
    });
  }

  function fulfillUser(route: Route) {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname === '/api/user/me' && method === 'GET') {
      return json(route, 200, me);
    }

    if (pathname === '/api/user/info' && method === 'GET') {
      return json(route, 200, { userInfo: me.userInfo });
    }

    if (pathname === '/api/user/profile' && method === 'PATCH') {
      const requestBody = route.request().postDataJSON() as {
        displayName?: string | null;
      };
      const nextDisplayName =
        requestBody.displayName ?? me.profile?.displayName ?? null;

      return json(route, 200, {
        profile: {
          ...(me.profile ?? {
            id: MOCK_USER_ID,
            avatarUrl: null,
            preferences: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
          displayName: nextDisplayName,
          updatedAt: new Date().toISOString(),
        },
        userInfo: {
          ...me.userInfo,
          displayName: nextDisplayName || me.userInfo.displayName,
        },
      });
    }

    if (pathname === '/api/user/settings' && method === 'PATCH') {
      const requestBody = route.request().postDataJSON() as {
        language?: string;
        theme?: string;
        defaultModel?: string;
        defaultPrompt?: string | null;
        skills?: Array<{
          id: string;
          name: string;
          content: string;
          enabled: boolean;
        }> | null;
      };

      const nextSkills = requestBody.skills ?? me.settings.chat?.skills ?? [];
      me.settings = {
        ...me.settings,
        language: requestBody.language ?? me.settings.language,
        theme: requestBody.theme ?? me.settings.theme,
        chat: {
          defaultModel:
            requestBody.defaultModel ?? me.settings.chat?.defaultModel ?? '',
          defaultPrompt:
            requestBody.defaultPrompt === null
              ? ''
              : requestBody.defaultPrompt ?? me.settings.chat?.defaultPrompt ?? '',
          skills: requestBody.skills === null ? [] : nextSkills,
        },
      };

      return json(route, 200, {
        settings: me.settings,
        userInfo: me.userInfo,
      });
    }

    return json(route, 404, { message: `unmocked user route: ${method} ${pathname}` });
  }

  return {
    fulfillSupabaseAuth,
    fulfillAuthSession,
    fulfillPublicConfig,
    fulfillUser,
  };
}

export type InstallQualityGateMocksOptions = {
  session?: MockSessionMode;
};

/** Intercept same-origin BFF routes and Supabase auth for local #37 browser smoke. */
export async function installQualityGateMocks(
  page: Page,
  options?: InstallQualityGateMocksOptions,
) {
  const mode = options?.session ?? 'anonymous';
  const handlers = createHandlers(mode);

  await page.route(`${MOCK_SUPABASE_URL}/**`, handlers.fulfillSupabaseAuth);
  await page.route('**/api/auth/session', handlers.fulfillAuthSession);
  await page.route('**/api/session', handlers.fulfillAuthSession);
  await page.route('**/api/auth/public-config', handlers.fulfillPublicConfig);
  await page.route('**/api/user/**', handlers.fulfillUser);
}
