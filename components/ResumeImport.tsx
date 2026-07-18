"use client";
import { authedFetch } from "@/lib/authedFetch";

import { useRef, useState } from "react";
import type { Resume } from "@/lib/resume";

export default function ResumeImport({
  onParsed,
  onClose,
}: {
  onParsed: (r: Resume) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function parsePdf(file: File) {
    setBusy(true);
    setError(null);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authedFetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      onParsed(data.resume as Resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  }

  async function parseText() {
    if (text.trim().length < 40) {
      setError("Paste a bit more of your resume text.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      onParsed(data.resume as Resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">
          Import resume
        </h2>
        <button
          onClick={onClose}
          className="text-sm font-semibold text-[var(--ink-soft)]"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-[var(--ink-soft)] mb-4">
        Upload your resume PDF (or paste the text). AI will structure it, then
        you review and save. Everything after that re-grounds on it.
      </p>

      {/* mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("pdf")}
          className={`pill !text-xs ${
            mode === "pdf"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]"
          }`}
        >
          📄 Upload PDF
        </button>
        <button
          onClick={() => setMode("text")}
          className={`pill !text-xs ${
            mode === "text"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]"
          }`}
        >
          📝 Paste text
        </button>
      </div>

      {mode === "pdf" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) parsePdf(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] py-10 flex flex-col items-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
          >
            <span className="text-3xl">📄</span>
            <span className="text-sm font-semibold text-[var(--ink)]">
              {busy ? "Parsing…" : fileName || "Tap to choose PDF"}
            </span>
            <span className="text-xs text-[var(--ink-faint)]">
              Text-based PDF works best
            </span>
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste your full resume text here…"
            className="w-full rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
          />
          <button
            onClick={parseText}
            disabled={busy}
            className="mt-3 w-full rounded-2xl bg-[var(--accent)] text-white font-semibold py-4 disabled:opacity-60 active:scale-[0.98] transition"
          >
            {busy ? "Parsing…" : "Parse with AI"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-[var(--rose-ink)]">{error}</p>
      )}
    </div>
  );
}
