"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  claimAnonymousThreads,
  createBrowserClient,
  signInWithGitHub,
  signOut,
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

  const loginWithGitHub = useCallback(
    async (redirectTo?: string) => {
      await signInWithGitHub(client, { redirectTo });
    },
    [client],
  );

  const logout = useCallback(async () => {
    await signOut(client);
  }, [client]);

  return { loginWithGitHub, logout, client };
}

export { claimAnonymousThreads };
