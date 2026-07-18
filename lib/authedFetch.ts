"use client";

import { getSupabase } from "./supabase";

// fetch wrapper that attaches the Supabase access token so protected /api
// routes can verify the caller is the owner. Works fine when Supabase isn't
// configured (no header) — the server allows through in that dev case.

export async function authedFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    /* no session — server decides */
  }
  return fetch(input, { ...init, headers });
}
