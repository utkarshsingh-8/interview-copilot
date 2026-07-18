"use client";
import { authedFetch } from "@/lib/authedFetch";

import { useEffect, useState } from "react";
import Avatar3D from "@/components/Avatar3D";
import ResumeEditor from "@/components/ResumeEditor";
import ResumeImport from "@/components/ResumeImport";
import { useResume } from "@/lib/resumeStore";
import { useSavedQuestions } from "@/lib/savedQuestions";
import { categoryMeta, type Category, type Question } from "@/lib/questions";
import AuthPanel from "@/components/AuthPanel";
import type { Resume } from "@/lib/resume";

const categories = Object.keys(categoryMeta) as Category[];

export default function ProfileView() {
  const { resume, save } = useResume();
  const { saved, replaceAll, clear } = useSavedQuestions();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editorInitial, setEditorInitial] = useState<Resume | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regen, setRegen] = useState<{ active: boolean; done: number; msg: string }>(
    { active: false, done: 0, msg: "" }
  );

  async function runReview() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReview(data.review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateBank() {
    setRegen({ active: true, done: 0, msg: "Starting…" });
    const collected: Question[] = [];
    try {
      for (let i = 0; i < categories.length; i++) {
        const c = categories[i];
        setRegen({
          active: true,
          done: i,
          msg: `Generating ${categoryMeta[c].label}…`,
        });
        const res = await authedFetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: c, count: 4, resume }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        if (Array.isArray(data.questions)) collected.push(...data.questions);
      }
      replaceAll(collected);
      setRegen({
        active: false,
        done: categories.length,
        msg: `✓ ${collected.length} fresh questions saved`,
      });
    } catch (e) {
      setRegen({
        active: false,
        done: 0,
        msg: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  function onSaveResume(r: Resume) {
    save(r);
    setEditing(false);
    setEditorInitial(null);
    setReview(null); // stale review for old resume
  }

  function resetLock() {
    localStorage.removeItem("copilot.faceid.status");
    localStorage.removeItem("copilot.faceid.cred");
    localStorage.removeItem("copilot.pk.enrolled");
    location.reload();
  }

  function clearProgress() {
    if (confirm("Clear all practice progress? This cannot be undone.")) {
      localStorage.removeItem("copilot.progress.v1");
      window.dispatchEvent(new Event("copilot:progress"));
      alert("Progress cleared.");
    }
  }

  if (importing) {
    return (
      <ResumeImport
        onParsed={(r) => {
          setEditorInitial(r);
          setImporting(false);
          setEditing(true);
        }}
        onClose={() => setImporting(false)}
      />
    );
  }

  if (editing) {
    return (
      <ResumeEditor
        initial={editorInitial ?? resume}
        onSave={onSaveResume}
        onCancel={() => {
          setEditing(false);
          setEditorInitial(null);
        }}
      />
    );
  }

  return (
    <div className="fade-up">
      {/* header */}
      <div className="flex items-center gap-4">
        <div className="rounded-full shadow-[var(--shadow)] shrink-0">
          <Avatar3D size={84} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-[var(--ink)] truncate">
            {resume.name}
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">{resume.title}</p>
          <p className="text-xs text-[var(--ink-faint)]">{resume.location}</p>
        </div>
      </div>

      {/* links */}
      <div className="mt-4 flex gap-2 flex-wrap items-center">
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
        <button
          onClick={() => setImporting(true)}
          className="pill bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)] !text-xs ml-auto"
        >
          📄 Import
        </button>
        <button
          onClick={() => {
            setEditorInitial(null);
            setEditing(true);
          }}
          className="pill bg-[var(--ink)] text-white !text-xs"
        >
          ✏️ Edit
        </button>
      </div>

      {/* Regenerate question bank */}
      <div className="mt-6 card p-5 text-white bg-[var(--violet)]">
        <p className="font-bold text-lg">Regenerate question bank</p>
        <p className="text-white/80 text-sm mt-1">
          Build a fresh set of interview questions grounded in your{" "}
          <span className="font-semibold">current</span> resume. Do this after
          editing.
        </p>
        <button
          onClick={regenerateBank}
          disabled={regen.active}
          className="mt-4 w-full rounded-2xl bg-white text-[var(--violet-ink)] font-semibold py-3.5 disabled:opacity-70 active:scale-[0.98] transition"
        >
          {regen.active
            ? `${regen.msg} (${regen.done}/${categories.length})`
            : saved.length
              ? "Regenerate again"
              : "Generate my question bank"}
        </button>
        {!regen.active && regen.msg && (
          <p className="mt-2 text-sm text-white/90">{regen.msg}</p>
        )}
        {saved.length > 0 && !regen.active && (
          <button
            onClick={clear}
            className="mt-2 text-xs font-semibold text-white/70 underline"
          >
            Clear saved bank ({saved.length})
          </button>
        )}
      </div>

      {/* AI resume review */}
      <div className="mt-4 card p-5 text-white bg-[var(--ink)]">
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
          {resume.experience.map((e, i) => (
            <div key={i}>
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
        {resume.projects.map((p, i) => (
          <div key={i} className="mb-3 last:mb-0">
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

      {/* settings */}
      <h2 className="text-lg font-extrabold text-[var(--ink)] mt-7 mb-3">
        Settings
      </h2>
      <div className="flex flex-col gap-2">
        <AuthPanel />
        <LockModeToggle />
        <button
          onClick={async () => {
            if (!("Notification" in window)) {
              alert("Notifications aren't supported on this device.");
              return;
            }
            const p = await Notification.requestPermission();
            alert(
              p === "granted"
                ? "Reminders on — you'll get a nudge when reviews are due."
                : "Reminders not enabled."
            );
          }}
          className="card-flat px-4 py-3.5 text-left text-sm font-semibold text-[var(--ink)] active:scale-[0.99] transition"
        >
          🔔 Enable daily reminders
        </button>
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

function LockModeToggle() {
  const [always, setAlways] = useState(true);
  useEffect(() => {
    setAlways((localStorage.getItem("copilot.lockmode") || "always") === "always");
  }, []);
  function toggle() {
    const next = !always;
    setAlways(next);
    localStorage.setItem("copilot.lockmode", next ? "always" : "session");
  }
  return (
    <div className="card-flat px-4 py-3.5 flex items-center justify-between">
      <div className="pr-3">
        <p className="text-sm font-semibold text-[var(--ink)]">
          🔐 Face ID every time
        </p>
        <p className="text-xs text-[var(--ink-faint)]">
          {always
            ? "Locks on every app open"
            : "Stay signed in between opens"}
        </p>
      </div>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={always}
        className={`h-7 w-12 shrink-0 rounded-full transition ${
          always ? "bg-[var(--violet)]" : "bg-[var(--surface-muted)]"
        }`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
            always ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
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
