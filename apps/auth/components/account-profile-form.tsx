'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOAuthLoginUrl, useSession } from '@acongm/auth-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
};

type UserMe = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  tier: string;
  isAnonymous: boolean;
  profile: Profile | null;
};

async function readResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = new Error(
      typeof body.message === 'string'
        ? body.message
        : `Account request failed (${response.status})`,
    );
    error.name = typeof body.code === 'string' ? body.code : 'ACCOUNT_REQUEST_FAILED';
    throw error;
  }
  return body;
}

export function AccountProfileForm() {
  const { session, loading } = useSession();
  const accessToken = session?.access_token ?? null;
  const [me, setMe] = useState<UserMe | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferencesText, setPreferencesText] = useState('{}');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMe(null);
    setError(null);
    if (!accessToken) return;

    void fetch('/api/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
      .then(readResponse)
      .then((body) => {
        if (cancelled) return;
        const next = body as unknown as UserMe;
        setMe(next);
        setDisplayName(next.profile?.display_name ?? '');
        setAvatarUrl(next.profile?.avatar_url ?? '');
        setPreferencesText(
          JSON.stringify(next.profile?.preferences ?? {}, null, 2),
        );
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : '账号资料加载失败。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const identity = useMemo(
    () => ({
      id: me?.id ?? session?.user.id ?? '',
      email: me?.email ?? session?.user.email ?? '',
      role: me?.role ?? '',
      tier: me?.tier ?? '',
    }),
    [me, session],
  );

  async function saveProfile() {
    if (!accessToken) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      let preferences: Record<string, unknown>;
      try {
        const parsed = JSON.parse(preferencesText || '{}');
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          throw new Error('Preferences must be a JSON object.');
        }
        preferences = parsed as Record<string, unknown>;
      } catch (cause) {
        throw new Error(
          cause instanceof Error
            ? `偏好设置格式错误：${cause.message}`
            : '偏好设置必须是 JSON object。',
        );
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          preferences,
        }),
      });
      const profile = (await readResponse(response)) as unknown as Profile;
      setMe((current) =>
        current ? { ...current, profile } : current,
      );
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '账号资料保存失败。');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">正在读取账号状态…</p>;
  }

  if (!session || session.user.is_anonymous) {
    return (
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">当前是访客身份</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            访客也有稳定的 Supabase 身份，但 Account Profile 只在永久账号下编辑。
          </p>
        </div>
        <Button asChild>
          <a href={getOAuthLoginUrl({ returnTo: window.location.href })}>登录或注册</a>
        </Button>
      </Card>
    );
  }

  if (!me && !error) {
    return <p className="text-sm text-muted-foreground">正在加载应用资料…</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">身份信息</h2>
          <p className="text-sm text-muted-foreground">
            这些字段来自经过验证的 Supabase principal / server role，只读展示。
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">User ID</dt><dd className="break-all font-mono">{identity.id}</dd></div>
          <div><dt className="text-muted-foreground">Email</dt><dd>{identity.email || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Role</dt><dd>{identity.role || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Tier</dt><dd>{identity.tier || '—'}</dd></div>
        </dl>
      </Card>

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">应用资料</h2>
          <p className="text-sm text-muted-foreground">
            display name、avatar 和 preferences 来自 public.profiles；不会把 user_metadata 当授权来源。
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Display name</span>
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Avatar URL</span>
          <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} type="url" placeholder="https://…" />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Preferences (JSON object)</span>
          <textarea
            value={preferencesText}
            onChange={(event) => setPreferencesText(event.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-xs text-muted-foreground">
            保存时采用明确的 replacement semantics。
          </span>
        </label>

        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {saved ? <Alert><AlertDescription>账号资料已保存。</AlertDescription></Alert> : null}

        <Button onClick={() => void saveProfile()} disabled={busy || !accessToken}>
          {busy ? '保存中…' : '保存资料'}
        </Button>
      </Card>
    </div>
  );
}
