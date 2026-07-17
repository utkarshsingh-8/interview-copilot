"use client";

// Supabase email auth. Session enables RLS-protected cloud sync of the resume
// and saved question bank. Emits "copilot:auth" so the resume/saved stores can
// reconcile local <-> cloud whenever the user signs in or out.

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      window.dispatchEvent(new Event("copilot:auth"));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase not configured" };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase not configured" };
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is ON, there's no session yet.
    const needsConfirm = !data.session;
    return { error: null, needsConfirm };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
  }, []);

  return { session, ready, signIn, signUp, signOut };
}
