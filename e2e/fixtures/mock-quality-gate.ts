import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
export const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
export const MOCK_ACCESS_TOKEN = 'mock-access-token-quality-gate';
export const MOCK_DISPLAY_NAME = 'Quality Gate Mock';
export const MOCK_EMAIL = 'qg-mock@acongm.com';

const MOCK_SESSION = {
  access_token: MOCK_ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: MOCK_EMAIL,
    phone: '',
    is_anonymous: false,
    app_metadata: { provider: 'email' },
    user_metadata: { display_name: MOCK_DISPLAY_NAME },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

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

function createUserPayload() {
  const settings = {
    language: 'zh-CN',
    theme: 'system' as const,
    chat: {
      defaultModel: 'deepseek-v4-flash',
      defaultPrompt: '',
    },
    preferences: {},
    schemaVersion: 1,
  };
  const userInfo = {
    id: MOCK_USER_ID,
    displayName: MOCK_DISPLAY_NAME,
    avatarUrl: null,
    email: MOCK_EMAIL,
    accountLabel: MOCK_EMAIL,
    role: 'viewer',
    tier: 'user',
    isAnonymous: false,
    source: 'profile',
  };
  const profile = {
    id: MOCK_USER_ID,
    displayName: MOCK_DISPLAY_NAME,
    avatarUrl: null,
    preferences: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { settings, userInfo, profile };
}

function fulfillSupabaseAuth(route: Route) {
  const url = route.request().url();
  const method = route.request().method();

  if (url.includes('/auth/v1/user') && method === 'GET') {
    return json(route, 200, MOCK_SESSION.user);
  }
  if (url.includes('/auth/v1/token') && method === 'POST') {
    return json(route, 200, MOCK_SESSION);
  }
  if (url.includes('/auth/v1/session') && method === 'GET') {
    return json(route, 200, { session: MOCK_SESSION });
  }
  return json(route, 200, {});
}

function fulfillUser(route: Route, store: ReturnType<typeof createUserPayload>) {
  const pathname = new URL(route.request().url()).pathname.replace(/\/$/, '');
  const method = route.request().method();

  if (
    pathname === '/api/user/me' ||
    pathname === '/api/user/info' ||
    pathname === '/api/user/settings'
  ) {
    if (method === 'GET') {
      return json(route, 200, {
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        name: MOCK_DISPLAY_NAME,
        role: 'viewer',
        tier: 'user',
        isAnonymous: false,
        profile: store.profile,
        userInfo: store.userInfo,
        settings: store.settings,
      });
    }
  }

  if (pathname === '/api/user/settings' && method === 'PATCH') {
    const body = readJsonBody(route);
    if (typeof body.language === 'string') store.settings.language = body.language;
    if (body.theme === 'light' || body.theme === 'dark' || body.theme === 'system') {
      store.settings.theme = body.theme;
    }
    if (typeof body.defaultModel === 'string' && body.defaultModel.trim()) {
      store.settings.chat.defaultModel = body.defaultModel.trim();
    }
    if (body.defaultPrompt === null) {
      store.settings.chat.defaultPrompt = '';
    } else if (typeof body.defaultPrompt === 'string') {
      store.settings.chat.defaultPrompt = body.defaultPrompt;
    }
    return json(route, 200, {
      settings: store.settings,
      userInfo: store.userInfo,
    });
  }

  if (pathname === '/api/user/profile' && method === 'PATCH') {
    const body = readJsonBody(route);
    if (typeof body.displayName === 'string' || body.displayName === null) {
      store.profile.displayName = body.displayName;
      store.userInfo.displayName = body.displayName || MOCK_DISPLAY_NAME;
    }
    return json(route, 200, {
      profile: store.profile,
      userInfo: store.userInfo,
    });
  }

  return json(route, 404, { message: `unmocked user route: ${pathname}` });
}

export async function installQualityGateMocks(page: Page) {
  const store = createUserPayload();

  await page.route('http://mock-supabase.test/**', (route) =>
    fulfillSupabaseAuth(route),
  );
  await page.route('**/api/user/**', (route) => fulfillUser(route, store));
  await page.route('**/api/session', (route) =>
    json(route, 200, {
      authenticated: true,
      configured: true,
      isAnonymous: false,
      user: {
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        name: MOCK_DISPLAY_NAME,
        avatarUrl: null,
      },
      userInfo: store.userInfo,
      accessToken: MOCK_ACCESS_TOKEN,
    }),
  );
}

export async function injectMockPermanentSession(page: Page, baseURL: string) {
  const hostname = new URL(baseURL).hostname;
  await page.context().addCookies([
    {
      name: 'sb-mock-supabase-auth-token',
      value: JSON.stringify(MOCK_SESSION),
      domain: hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
