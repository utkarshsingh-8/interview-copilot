"use client";

// Optional Supabase client. The app works fully offline (localStorage) without
// it; once you add the env vars below, you can sync progress and store an
// AI-parsed resume in the cloud. Returns null until configured so nothing
// breaks before setup.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Enables auth.signInWithPasskey() / auth.registerPasskey()
        experimental: { passkey: true },
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
