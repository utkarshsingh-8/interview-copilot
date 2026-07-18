"use client";

/**
 * LockGate — private entry gate. The app opens ONLY for the owner.
 *
 * Two real login paths, both creating a genuine Supabase session (so the
 * protected /api routes and cloud sync work either way):
 *   1. Passkey (Face ID / Touch ID) via Supabase WebAuthn — no password.
 *   2. Email + password — the fallback and first-time path.
 *
 * A passkey is registered right after the first email sign-in. There is no
 * "open without lock" path.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { ALLOWED_EMAIL } from "@/lib/config";

const PK_FLAG = "copilot.pk.enrolled";

type Phase = "checking" | "locked" | "offerPk" | "unlocked";

export default function LockGate({ children }: { children: React.ReactNode }) {
  const { session, ready: authReady, signIn, signUp } = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pkBusy, setPkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [webauthn, setWebauthn] = useState(false);
  const [pkEnrolled, setPkEnrolled] = useState(false);

  useEffect(() => {
    setWebauthn(typeof window !== "undefined" && !!window.PublicKeyCredential);
    setPkEnrolled(localStorage.getItem(PK_FLAG) === "1");
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const em = session?.user?.email?.toLowerCase();
    if (em === ALLOWED_EMAIL) {
      setPhase((p) => (p === "offerPk" ? p : "unlocked"));
    } else {
      setPhase((p) => (p === "unlocked" || p === "offerPk" ? p : "locked"));
    }
  }, [authReady, session]);

  const passkeySignIn = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    setPkBusy(true);
    setError(null);
    setMsg(null);
    try {
      const { error } = await sb.auth.signInWithPasskey();
      if (error) throw error;
      setPhase("unlocked");
    } catch (e) {
      setError(
        "Face ID sign-in failed. If you haven't set it up on this device yet, sign in with email first."
      );
      console.error(e);
    } finally {
      setPkBusy(false);
    }
  }, []);

  const registerPasskey = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setPhase("unlocked");
      return;
    }
    setPkBusy(true);
    setError(null);
    try {
      const { error } = await sb.auth.registerPasskey();
      if (error) throw error;
      localStorage.setItem(PK_FLAG, "1");
      setPkEnrolled(true);
      setPhase("unlocked");
    } catch (e) {
      setError("Couldn't set up Face ID here. You can still use email.");
      console.error(e);
    } finally {
      setPkBusy(false);
    }
  }, []);

  const submitEmail = useCallback(async () => {
    const em = email.trim().toLowerCase();
    setError(null);
    setMsg(null);
    if (em !== ALLOWED_EMAIL) {
      setError("This app is private. Only the owner's email can open it.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const res =
      mode === "in" ? await signIn(em, password) : await signUp(em, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (mode === "up" && "needsConfirm" in res && res.needsConfirm) {
      setMsg(
        "Account created. Confirm via email, then sign in. (Tip: turn off 'Confirm email' in Supabase for instant access.)"
      );
      setMode("in");
      return;
    }
    // signed in — offer to set up a passkey for next time
    if (webauthn && isSupabaseConfigured()) setPhase("offerPk");
    else setPhase("unlocked");
  }, [email, password, mode, signIn, signUp, webauthn]);

  if (phase === "unlocked") return <>{children}</>;

  if (phase === "checking" || !authReady) {
    return (
      <div className="min-h-dvh grid place-items-center bg-[var(--bg)]">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (phase === "offerPk") {
    return (
      <Shell
        title="Set up Face ID?"
        subtitle="Sign in with your face next time — no password to type on this device."
      >
        {error && <ErrorText>{error}</ErrorText>}
        <div className="mt-8 w-full flex flex-col gap-3">
          <button
            onClick={registerPasskey}
            disabled={pkBusy}
            className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
          >
            {pkBusy ? "Setting up…" : "Enable Face ID"}
          </button>
          <button
            onClick={() => setPhase("unlocked")}
            className="w-full rounded-2xl text-[var(--ink-soft)] font-semibold py-3 active:scale-[0.98] transition"
          >
            Not now
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={mode === "in" ? "Welcome back" : "Create your login"}
      subtitle="This coach is private to Utkarsh. Sign in to continue."
    >
      {webauthn && isSupabaseConfigured() && (
        <>
          <button
            onClick={passkeySignIn}
            disabled={pkBusy}
            className="mt-6 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <FaceMini /> {pkBusy ? "Scanning…" : "Sign in with Face ID"}
          </button>
          <div className="my-4 flex items-center gap-3 text-[var(--ink-faint)]">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="text-xs font-semibold">or use email</span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
        </>
      )}

      <div className={webauthn && isSupabaseConfigured() ? "" : "mt-6"}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="w-full rounded-2xl bg-[var(--surface)] px-4 py-3.5 text-sm outline-none shadow-[var(--shadow-sm)] mb-2.5 placeholder:text-[var(--ink-faint)]"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitEmail()}
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder="Password"
          className="w-full rounded-2xl bg-[var(--surface)] px-4 py-3.5 text-sm outline-none shadow-[var(--shadow-sm)] mb-3 placeholder:text-[var(--ink-faint)]"
        />
        <button
          onClick={submitEmail}
          disabled={busy || !isSupabaseConfigured()}
          className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError(null);
            setMsg(null);
          }}
          className="mt-3 w-full text-sm font-semibold text-[var(--violet-ink)]"
        >
          {mode === "in"
            ? "First time? Create account"
            : "Have an account? Sign in"}
        </button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-3 text-xs text-[var(--ink-faint)] text-center">
          Login needs Supabase env vars configured.
        </p>
      )}
      {pkEnrolled && (
        <p className="mt-3 text-[11px] text-[var(--ink-faint)] text-center">
          Face ID is set up on this device — tap the button above.
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
      {msg && (
        <p className="mt-3 text-sm font-medium text-[#2f8a5b] text-center">
          {msg}
        </p>
      )}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-[var(--bg)] text-center safe-top safe-bottom">
      <div className="fade-up flex flex-col items-center w-full max-w-sm">
        <div className="h-20 w-20 rounded-[1.75rem] bg-[var(--surface)] shadow-[var(--shadow)] grid place-items-center mb-7">
          <FaceIcon />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">{subtitle}</p>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-sm font-medium text-[var(--rose-ink)] text-center">
      {children}
    </p>
  );
}

function FaceIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
        stroke="#6d5dd3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 10v1M15 10v1M9.5 15c.7.7 1.6 1 2.5 1s1.8-.3 2.5-1M12 10v3h-.8"
        stroke="#1c1830"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FaceMini() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
