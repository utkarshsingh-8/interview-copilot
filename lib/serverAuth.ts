import { createClient } from "@supabase/supabase-js";
import { ALLOWED_EMAIL } from "./config";

// Server-side gate for API routes. When Supabase is configured, every AI route
// requires a valid access token belonging to the owner — this stops anyone who
// finds the deployed URL from burning the Groq key. When Supabase is NOT
// configured (local dev), it allows through so the app still works.

export async function requireOwner(
  req: Request
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured → dev mode, allow.
  if (!url || !anon) return { ok: true };

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (!token) {
    return { ok: false, status: 401, error: "Sign in to use AI features." };
  }

  try {
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.auth.getUser(token);
    const email = data.user?.email?.toLowerCase();
    if (error || !email) {
      return { ok: false, status: 401, error: "Invalid session." };
    }
    if (email !== ALLOWED_EMAIL) {
      return { ok: false, status: 403, error: "Not authorized." };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: "Auth check failed." };
  }
}
