"use client";

import { useState } from "react";
import { resume } from "@/lib/resume";
import Avatar3D from "@/components/Avatar3D";

export default function ProfileView() {
  const [review, setReview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReview(data.review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function resetLock() {
    localStorage.removeItem("copilot.faceid.status");
    localStorage.removeItem("copilot.faceid.cred");
    location.reload();
  }

  function clearProgress() {
    if (confirm("Clear all practice progress? This cannot be undone.")) {
      localStorage.removeItem("copilot.progress.v1");
      window.dispatchEvent(new Event("copilot:progress"));
      alert("Progress cleared.");
    }
  }

  return (
    <div className="fade-up">
      {/* header */}
      <div className="flex items-center gap-4">
        <div className="rounded-full shadow-[var(--shadow)] shrink-0">
          <Avatar3D size={84} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--ink)]">
            {resume.name}
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">{resume.title}</p>
          <p className="text-xs text-[var(--ink-faint)]">{resume.location}</p>
        </div>
      </div>

      {/* links */}
      <div className="mt-4 flex gap-2">
        {resume.links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="pill bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)] !text-xs"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* AI resume review */}
      <div className="mt-6 card p-5 text-white bg-[var(--ink)]">
        <p className="font-bold text-lg">AI Resume Review</p>
        <p className="text-white/70 text-sm mt-1">
          Get a senior recruiter&apos;s honest take with concrete rewrites.
        </p>
        <button
          onClick={runReview}
          disabled={busy}
          className="mt-4 w-full rounded-2xl bg-white text-[var(--ink)] font-semibold py-3.5 disabled:opacity-60 active:scale-[0.98] transition"
        >
          {busy ? "Reviewing…" : review ? "Re-run review" : "Review my resume"}
        </button>
        {error && <p className="mt-3 text-sm text-[#ffb4c4]">{error}</p>}
      </div>

      {review && (
        <div className="mt-4 card-flat p-5 fade-up">
          <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
            {review}
          </p>
        </div>
      )}

      {/* resume sections */}
      <Section title="Summary">
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          {resume.summary}
        </p>
      </Section>

      <Section title="Experience">
        <div className="flex flex-col gap-4">
          {resume.experience.map((e) => (
            <div key={e.company}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[15px] text-[var(--ink)]">
                    {e.role}
                  </p>
                  <p className="text-sm text-[var(--ink-soft)]">{e.company}</p>
                </div>
                <span className="text-[11px] text-[var(--ink-faint)] whitespace-nowrap">
                  {e.start}–{e.end}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Projects">
        {resume.projects.map((p) => (
          <div key={p.name} className="mb-3 last:mb-0">
            <p className="font-bold text-[15px] text-[var(--ink)]">{p.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-semibold text-[var(--ink-faint)] bg-[var(--surface-muted)] rounded-full px-2 py-1"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        <div className="flex flex-wrap gap-1.5">
          {[
            ...resume.skills.genai,
            ...resume.skills.mldl,
            ...resume.skills.vectorSearch,
            ...resume.skills.backend,
          ].map((s) => (
            <span
              key={s}
              className="text-[11px] font-semibold text-[var(--ink-soft)] bg-[var(--surface-muted)] rounded-full px-2.5 py-1"
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Education">
        {resume.education.map((ed) => (
          <div key={ed.school}>
            <p className="font-bold text-[15px] text-[var(--ink)]">
              {ed.degree}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">{ed.school}</p>
            <p className="text-xs text-[var(--ink-faint)]">
              {ed.start}–{ed.end}
            </p>
          </div>
        ))}
      </Section>

      {/* settings */}
      <h2 className="text-lg font-extrabold text-[var(--ink)] mt-7 mb-3">
        Settings
      </h2>
      <div className="flex flex-col gap-2">
        <button
          onClick={resetLock}
          className="card-flat px-4 py-3.5 text-left text-sm font-semibold text-[var(--ink)] active:scale-[0.99] transition"
        >
          🔒 Reset Face ID lock
        </button>
        <button
          onClick={clearProgress}
          className="card-flat px-4 py-3.5 text-left text-sm font-semibold text-[var(--rose-ink)] active:scale-[0.99] transition"
        >
          🗑️ Clear practice progress
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] text-[var(--ink-faint)]">
        Interview Copilot · built for {resume.name}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-extrabold text-[var(--ink)] mb-3">{title}</h2>
      <div className="card-flat p-5">{children}</div>
    </div>
  );
}
