"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AuthPanel() {
  const { session, ready, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="card-flat p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ink)]">
            ☁️ Cloud sync
          </span>
          <span className="text-xs font-bold text-[var(--ink-faint)]">
            Not set up
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then
          run supabase/schema.sql to enable multi-device sync.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card-flat p-4 text-sm text-[var(--ink-soft)]">
        Checking session…
      </div>
    );
  }

  if (session) {
    return (
      <div className="card-flat p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              ☁️ Synced to cloud
            </p>
            <p className="text-xs text-[var(--ink-soft)] truncate max-w-[200px]">
              {session.user.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="pill bg-[var(--surface-muted)] text-[var(--ink-soft)] !text-xs"
          >
            Sign out
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[#2f8a5b] font-semibold">
          Your resume &amp; question bank sync across devices.
        </p>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res =
      mode === "in"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    if (mode === "up" && "needsConfirm" in res && res.needsConfirm) {
      setMsg(
        "Account created. Check your email to confirm, then sign in. (Tip: disable 'Confirm email' in Supabase Auth settings for instant login.)"
      );
      setMode("in");
    } else {
      setMsg("Signed in — syncing your data to the cloud…");
    }
  }

  return (
    <div className="card-flat p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[var(--ink)]">
          ☁️ {mode === "in" ? "Sign in to sync" : "Create account"}
        </span>
        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setErr(null);
            setMsg(null);
          }}
          className="text-xs font-semibold text-[var(--violet-ink)]"
        >
          {mode === "in" ? "Create account" : "Have an account?"}
        </button>
      </div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Email"
        autoComplete="email"
        className="w-full rounded-xl bg-[var(--surface-muted)] px-3 py-2.5 text-sm outline-none mb-2 placeholder:text-[var(--ink-faint)]"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password (min 6 chars)"
        autoComplete={mode === "in" ? "current-password" : "new-password"}
        className="w-full rounded-xl bg-[var(--surface-muted)] px-3 py-2.5 text-sm outline-none mb-3 placeholder:text-[var(--ink-faint)]"
      />
      <button
        onClick={submit}
        disabled={busy || !email || password.length < 6}
        className="w-full rounded-xl bg-[var(--ink)] text-white text-sm font-semibold py-3 disabled:opacity-50 active:scale-[0.98] transition"
      >
        {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      {err && <p className="mt-2 text-xs text-[var(--rose-ink)]">{err}</p>}
      {msg && <p className="mt-2 text-xs text-[#2f8a5b]">{msg}</p>}
    </div>
  );
}
