"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  claimAnonymousThreads,
  createBrowserClient,
  signInWithGitHub,
  signInWithGoogle,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type SocialAuthProvider,
} from "./client.js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const client = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let mounted = true;

    void client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
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

  return { session, loading, client };
}

export function useUser() {
  const { session, loading } = useSession();
  return {
    user: (session?.user ?? null) as User | null,
    loading,
  };
}

export function useAuthActions() {
  const { client } = useSession();

  const loginWithOAuth = useCallback(
    async (provider: SocialAuthProvider, redirectTo?: string) => {
      await signInWithOAuth(client, { provider, redirectTo });
    },
    [client],
  );

  const loginWithGitHub = useCallback(
    async (redirectTo?: string) => {
      await signInWithGitHub(client, { redirectTo });
    },
    [client],
  );

  const loginWithGoogle = useCallback(
    async (redirectTo?: string) => {
      await signInWithGoogle(client, { redirectTo });
    },
    [client],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      return signInWithPassword(client, { email, password });
    },
    [client],
  );

  const registerWithPassword = useCallback(
    async (email: string, password: string, emailRedirectTo?: string) => {
      return signUpWithPassword(client, { email, password, emailRedirectTo });
    },
    [client],
  );

  const logout = useCallback(async () => {
    await signOut(client);
  }, [client]);

  return {
    loginWithOAuth,
    loginWithGitHub,
    loginWithGoogle,
    loginWithPassword,
    registerWithPassword,
    logout,
    client,
  };
}

export { claimAnonymousThreads };
