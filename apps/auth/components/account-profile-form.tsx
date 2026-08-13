'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getOAuthLoginUrl,
  getUserMe,
  updateUserProfile,
  updateUserSettings,
  useSession,
  type UserMe,
  type UserSettingsView,
} from '@acongm/auth-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
] as const;

export function AccountProfileForm() {
  const { session, loading } = useSession();
  const accessToken = session?.access_token ?? null;
  const [me, setMe] = useState<UserMe | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferencesText, setPreferencesText] = useState('{}');
  const [language, setLanguage] = useState('zh-CN');
  const [theme, setTheme] = useState<UserSettingsView['theme']>('system');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMe(null);
    setError(null);
    if (!accessToken) return;

    void getUserMe({ accessToken })
      .then((next) => {
        if (cancelled) return;
        setMe(next);
        setDisplayName(next.profile?.displayName ?? '');
        setAvatarUrl(next.profile?.avatarUrl ?? '');
        setPreferencesText(
          JSON.stringify(next.profile?.preferences ?? {}, null, 2),
        );
        setLanguage(next.settings.language);
        setTheme(next.settings.theme);
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

  const identity = useMemo(() => {
    const userInfo = me?.userInfo;
    return {
      id: userInfo?.id ?? me?.id ?? session?.user.id ?? '',
      email: userInfo?.email ?? me?.email ?? session?.user.email ?? '',
      displayName: userInfo?.displayName ?? me?.name ?? '',
      role: userInfo?.role ?? me?.role ?? '',
      tier: userInfo?.tier ?? me?.tier ?? '',
      source: userInfo?.source ?? '',
    };
  }, [me, session]);

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

      const result = await updateUserProfile(
        {
          displayName: displayName.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          preferences,
        },
        { accessToken },
      );
      setMe((current) =>
        current
          ? {
              ...current,
              profile: result.profile,
              userInfo: result.userInfo,
            }
          : current,
      );
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '账号资料保存失败。');
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    if (!accessToken) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const result = await updateUserSettings(
        { language: language.trim(), theme },
        { accessToken },
      );
      setMe((current) =>
        current
          ? {
              ...current,
              settings: result.settings,
              userInfo: result.userInfo,
            }
          : current,
      );
      setLanguage(result.settings.language);
      setTheme(result.settings.theme);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '偏好设置保存失败。');
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
        <Button
          onClick={() => {
            window.location.href = getOAuthLoginUrl({ returnTo: '/account' });
          }}
        >
          登录或注册
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
            这些字段来自经过验证的 Supabase principal / server userInfo，只读展示。
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">User ID</dt><dd className="break-all font-mono">{identity.id}</dd></div>
          <div><dt className="text-muted-foreground">Display name</dt><dd>{identity.displayName || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Email</dt><dd>{identity.email || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Role</dt><dd>{identity.role || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Tier</dt><dd>{identity.tier || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Source</dt><dd>{identity.source || '—'}</dd></div>
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

        <Button onClick={() => void saveProfile()} disabled={busy || !accessToken}>
          {busy ? '保存中…' : '保存资料'}
        </Button>
      </Card>

      <Card id="settings" className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">界面偏好</h2>
          <p className="text-sm text-muted-foreground">
            通过 /api/user/settings 写入 typed preferences（language / theme）。
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Language</span>
          <Input value={language} onChange={(event) => setLanguage(event.target.value)} maxLength={16} />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Theme</span>
          <select
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value as UserSettingsView['theme'])
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Button onClick={() => void saveSettings()} disabled={busy || !accessToken}>
          {busy ? '保存中…' : '保存偏好'}
        </Button>
      </Card>

      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {saved ? <Alert><AlertDescription>已保存。</AlertDescription></Alert> : null}
    </div>
  );
}
