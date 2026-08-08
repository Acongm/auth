export type ApplicationProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type UserMe = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  tier: string;
  isAnonymous: boolean;
  profile: ApplicationProfile | null;
};

export type UpdateApplicationProfile = {
  displayName?: string | null;
  avatarUrl?: string | null;
  preferences?: Record<string, unknown>;
};

export class UserApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'UserApiError';
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_USER_API = '/api/user';

function normalizeProfile(raw: unknown): ApplicationProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string') return null;
  return {
    id: row.id,
    displayName:
      typeof row.display_name === 'string' ? row.display_name : null,
    avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : null,
    preferences:
      row.preferences && typeof row.preferences === 'object'
        ? (row.preferences as Record<string, unknown>)
        : {},
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new UserApiError(
      typeof body.message === 'string'
        ? body.message
        : `Account request failed (${response.status})`,
      response.status,
      typeof body.code === 'string' ? body.code : undefined,
    );
  }
  return body;
}

export async function getUserMe(options: {
  accessToken: string;
  baseUrl?: string;
}): Promise<UserMe> {
  const response = await fetch(`${options.baseUrl || DEFAULT_USER_API}/me`, {
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      Accept: 'application/json',
    },
  });
  const body = await readJson(response);
  return {
    id: String(body.id || ''),
    email: typeof body.email === 'string' ? body.email : null,
    name: typeof body.name === 'string' ? body.name : null,
    role: typeof body.role === 'string' ? body.role : 'anonymous',
    tier: typeof body.tier === 'string' ? body.tier : 'anon',
    isAnonymous: body.isAnonymous === true,
    profile: normalizeProfile(body.profile),
  };
}

export async function updateUserProfile(
  patch: UpdateApplicationProfile,
  options: { accessToken: string; baseUrl?: string },
): Promise<ApplicationProfile> {
  const body: Record<string, unknown> = {};
  if (patch.displayName !== undefined) body.displayName = patch.displayName;
  if (patch.avatarUrl !== undefined) body.avatarUrl = patch.avatarUrl;
  if (patch.preferences !== undefined) body.preferences = patch.preferences;

  if (Object.keys(body).length === 0) {
    throw new UserApiError('Profile patch is empty.', 400, 'PROFILE_PATCH_EMPTY');
  }

  const response = await fetch(
    `${options.baseUrl || DEFAULT_USER_API}/profile`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const result = normalizeProfile(await readJson(response));
  if (!result) {
    throw new UserApiError('Invalid profile response.', 502, 'INVALID_PROFILE_RESPONSE');
  }
  return result;
}
