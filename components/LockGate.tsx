"use client";

/**
 * LockGate — a biometric "Face ID" lock for the whole app.
 *
 * It uses the WebAuthn platform authenticator, which on an iPhone (Safari /
 * installed PWA) triggers the native Face ID / Touch ID prompt. On first run
 * the user can enable Face ID (registers a passkey) or skip. Once enabled, the
 * app requires a successful biometric check to unlock on every load.
 *
 * Note: this is a *client-side* convenience lock for a personal app — there is
 * no server verifying the assertion, so it gates the UI rather than protecting
 * data on the wire. Real data-access auth is handled separately by Supabase.
 */

import { useCallback, useEffect, useState } from "react";

const LS_KEY = "copilot.faceid.status"; // "enabled" | "skipped"
const LS_CRED = "copilot.faceid.cred"; // base64url credential id

type Phase = "checking" | "gate" | "locked" | "unlocked";

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
  const [phase, setPhase] = useState<Phase>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const hasWebAuthn =
      typeof window !== "undefined" && !!window.PublicKeyCredential;
    setSupported(hasWebAuthn);
    const status = localStorage.getItem(LS_KEY);
    if (status === "enabled" && localStorage.getItem(LS_CRED)) {
      setPhase("locked");
    } else if (status === "skipped") {
      setPhase("unlocked");
    } else {
      setPhase("gate");
    }
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: "Interview Copilot", id: window.location.hostname },
          user: {
            id: randomBytes(16),
            name: "utkarsh",
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
      if (!cred) throw new Error("No credential returned");
      localStorage.setItem(LS_CRED, bufToB64url(cred.rawId));
      localStorage.setItem(LS_KEY, "enabled");
      setPhase("unlocked");
    } catch (e) {
      setError(
        "Couldn't set up Face ID on this device. You can continue without it."
      );
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const unlock = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const rawId = localStorage.getItem(LS_CRED);
      if (!rawId) throw new Error("No credential stored");
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
      setError("Face ID failed. Try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const skip = useCallback(() => {
    localStorage.setItem(LS_KEY, "skipped");
    setPhase("unlocked");
  }, []);

  if (phase === "unlocked") return <>{children}</>;

  if (phase === "checking") {
    return (
      <div className="min-h-dvh grid place-items-center bg-[var(--bg)]">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isGate = phase === "gate";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-[var(--bg)] text-center safe-top safe-bottom">
      <div className="fade-up flex flex-col items-center max-w-sm">
        <div className="h-24 w-24 rounded-[2rem] bg-[var(--surface)] shadow-[var(--shadow)] grid place-items-center mb-8">
          <FaceIcon />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          {isGate ? "Interview Copilot" : "Welcome back"}
        </h1>
        <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
          {isGate
            ? "Lock your personal coach behind Face ID so only you can open it."
            : "Unlock with Face ID to continue your prep."}
        </p>

        {error && (
          <p className="mt-4 text-sm font-medium text-[var(--rose-ink)]">
            {error}
          </p>
        )}

        <div className="mt-8 w-full flex flex-col gap-3">
          {isGate ? (
            <>
              <button
                onClick={enable}
                disabled={busy || !supported}
                className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
              >
                {busy ? "Setting up…" : "Enable Face ID"}
              </button>
              <button
                onClick={skip}
                className="w-full rounded-2xl bg-transparent text-[var(--ink-soft)] font-semibold py-3 active:scale-[0.98] transition"
              >
                Continue without lock
              </button>
              {!supported && (
                <p className="text-xs text-[var(--ink-faint)]">
                  Face ID needs a supported device/browser (works on iPhone).
                </p>
              )}
            </>
          ) : (
            <button
              onClick={unlock}
              disabled={busy}
              className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
            >
              {busy ? "Scanning…" : "Unlock with Face ID"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FaceIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
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
