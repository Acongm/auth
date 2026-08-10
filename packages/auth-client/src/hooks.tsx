'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
  claimAnonymousThreads,
  createBrowserClient,
  getOAuthLoginUrl,
  isAuthConfigured,
  signOut,
} from './client';
import { getUserInfo, type UserInfoView, type UserMe } from './profile';

export function useSession() {
  const configured = isAuthConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const client = useMemo(
    () => (configured ? createBrowserClient() : null),
    [configured],
  );

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let mounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  return { session, loading, client, configured };
}

export function useUser() {
  const { session, loading, configured } = useSession();
  return {
    user: (session?.user ?? null) as User | null,
    loading,
    configured,
  };
}

/**
 * Loads server-side getUserInfo for login-state UI.
 * Falls back to null on 401/network errors so buttons can keep session-based UI.
 */
export function useUserInfo(options?: { baseUrl?: string }) {
  const { session, loading: sessionLoading, configured } = useSession();
  const [userMe, setUserMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = session?.access_token ?? null;
  const baseUrl = options?.baseUrl;

  useEffect(() => {
    if (!accessToken) {
      setUserMe(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getUserInfo({
      accessToken,
      baseUrl,
    })
      .then((next) => {
        if (cancelled) return;
        setUserMe(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setUserMe(null);
        setError(err instanceof Error ? err.message : 'Failed to load user info');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, baseUrl]);

  const userInfo: UserInfoView | null = userMe?.userInfo ?? null;

  return {
    userMe,
    userInfo,
    loading: sessionLoading || loading,
    error,
    configured,
    hasSession: Boolean(session),
  };
}

export function useAuthActions() {
  const { client, configured } = useSession();

  const login = useCallback((returnTo?: string) => {
    const href =
      typeof window !== 'undefined'
        ? getOAuthLoginUrl({ returnTo: returnTo ?? window.location.href })
        : getOAuthLoginUrl();
    window.location.href = href;
  }, []);

  const logout = useCallback(async () => {
    if (!client) return;
    await signOut(client);
  }, [client]);

  return { login, logout, client, configured };
}

export { claimAnonymousThreads, getOAuthLoginUrl, isAuthConfigured };
