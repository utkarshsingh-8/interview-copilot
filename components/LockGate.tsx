"use client";

/**
 * LockGate — the private entry gate for the app.
 *
 * The app opens ONLY for the owner. Two ways in:
 *   1. Email + password (Supabase) — restricted to ALLOWED_EMAIL. Works on any
 *      device and is the root of trust.
 *   2. Face ID (WebAuthn platform authenticator) — a fast device shortcut that
 *      can be enrolled after signing in with email once.
 *
 * There is no "open without lock" path. On a device with no owner biometric
 * and no email session, the app stays locked.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ALLOWED_EMAIL } from "@/lib/config";

const LS_CRED = "copilot.faceid.cred"; // base64url credential id

type Phase = "checking" | "locked" | "offerFace" | "unlocked";

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBuf(b64: string): ArrayBuffer {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const str = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}
function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(a);
  return a;
}

export default function LockGate({ children }: { children: React.ReactNode }) {
  const { session, ready: authReady, signIn, signUp } = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [webauthn, setWebauthn] = useState(false);
  const [hasCred, setHasCred] = useState(false);

  useEffect(() => {
    setWebauthn(typeof window !== "undefined" && !!window.PublicKeyCredential);
    setHasCred(!!localStorage.getItem(LS_CRED));
  }, []);

  // Decide gate state once auth session is known.
  useEffect(() => {
    if (!authReady) return;
    const em = session?.user?.email?.toLowerCase();
    if (em === ALLOWED_EMAIL) {
      setPhase((p) => (p === "offerFace" ? p : "unlocked"));
      return;
    }
    // no valid owner session — stay locked unless already unlocked via Face ID
    setPhase((p) => (p === "unlocked" || p === "offerFace" ? p : "locked"));
  }, [authReady, session]);

  const enableFace = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: "Interview Copilot", id: window.location.hostname },
          user: {
            id: randomBytes(16),
            name: ALLOWED_EMAIL,
            displayName: "Utkarsh Singh",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error("No credential");
      localStorage.setItem(LS_CRED, bufToB64url(cred.rawId));
      setHasCred(true);
      setPhase("unlocked");
    } catch (e) {
      setError("Couldn't set up Face ID on this device.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const unlockFace = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const rawId = localStorage.getItem(LS_CRED);
      if (!rawId) throw new Error("No credential");
      await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          rpId: window.location.hostname,
          allowCredentials: [{ type: "public-key", id: b64urlToBuf(rawId) }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      setPhase("unlocked");
    } catch (e) {
      setError("Face ID failed. Try again or use email.");
      console.error(e);
    } finally {
      setBusy(false);
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
      mode === "in"
        ? await signIn(em, password)
        : await signUp(em, password);
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
    // signed in — offer to enrol Face ID as a shortcut if possible
    if (webauthn && !hasCred) setPhase("offerFace");
    else setPhase("unlocked");
  }, [email, password, mode, signIn, signUp, webauthn, hasCred]);

  if (phase === "unlocked") return <>{children}</>;

  if (phase === "checking" || !authReady) {
    return (
      <div className="min-h-dvh grid place-items-center bg-[var(--bg)]">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // ---- offer Face ID after email login ----
  if (phase === "offerFace") {
    return (
      <Shell title="Set up Face ID?" subtitle="Unlock faster next time — no password needed on this device.">
        {error && <ErrorText>{error}</ErrorText>}
        <div className="mt-8 w-full flex flex-col gap-3">
          <button
            onClick={enableFace}
            disabled={busy}
            className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
          >
            {busy ? "Setting up…" : "Enable Face ID"}
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

  // ---- locked: email + optional Face ID ----
  return (
    <Shell
      title={mode === "in" ? "Welcome back" : "Create your login"}
      subtitle="This coach is private to Utkarsh. Sign in to continue."
    >
      {hasCred && (
        <button
          onClick={unlockFace}
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <FaceMini /> {busy ? "Scanning…" : "Unlock with Face ID"}
        </button>
      )}

      {hasCred && (
        <div className="my-4 flex items-center gap-3 text-[var(--ink-faint)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-xs font-semibold">or use email</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
      )}

      <div className={hasCred ? "" : "mt-6"}>
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
          {mode === "in" ? "First time? Create account" : "Have an account? Sign in"}
        </button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-3 text-xs text-[var(--ink-faint)] text-center">
          Email login needs Supabase env vars configured.
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
