"use client";

import { useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { readResume } from "@/lib/resumeStore";
import { addSaved } from "@/lib/notes";
import { STARTER_PROMPTS, useStories, type Story } from "@/lib/stories";

type Critique = {
  score: number;
  strengths: string[];
  improvements: string[];
  rewrite: string;
};

export default function StarView() {
  const { stories, save, remove, create } = useStories();
  const [editing, setEditing] = useState<Story | null>(null);

  if (editing) {
    return (
      <Editor
        story={editing}
        onSave={(s) => {
          save(s);
          setEditing(null);
        }}
        onDelete={() => {
          remove(editing.id);
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="fade-up">
      <p className="text-sm font-semibold text-[var(--violet-ink)]">Behavioral</p>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
        STAR stories
      </h1>
      <p className="mt-2 text-[var(--ink-soft)] text-sm">
        Build a bank of Situation-Task-Action-Result stories. Get AI critique so
        they land in interviews.
      </p>

      <button
        onClick={() => setEditing(create())}
        className="mt-4 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-3.5 active:scale-[0.98] transition"
      >
        + New story
      </button>

      {stories.length === 0 && (
        <>
          <p className="mt-6 text-xs font-semibold text-[var(--ink-soft)] mb-2">
            Common prompts to prepare
          </p>
          <div className="flex flex-col gap-2">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setEditing(create(p))}
                className="card-flat px-4 py-3 text-left text-sm font-medium text-[var(--ink)] active:scale-[0.99] transition"
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {stories.map((s) => (
          <button
            key={s.id}
            onClick={() => setEditing(s)}
            className="card-flat p-4 text-left active:scale-[0.99] transition"
          >
            <p className="font-bold text-[15px] text-[var(--ink)]">
              {s.title || "Untitled story"}
            </p>
            <p className="text-xs text-[var(--ink-soft)] mt-1 line-clamp-2">
              {s.situation || s.action || "Tap to build this story…"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Editor({
  story,
  onSave,
  onDelete,
  onCancel,
}: {
  story: Story;
  onSave: (s: Story) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Story>(story);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crit, setCrit] = useState<Critique | null>(null);
  const [savedRw, setSavedRw] = useState(false);
  const set = (patch: Partial<Story>) => setDraft((d) => ({ ...d, ...patch }));

  async function critique() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, resume: readResume() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCrit(data as Critique);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">STAR story</h2>
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-[var(--ink-soft)]"
        >
          Cancel
        </button>
      </div>

      <Field label="Title / prompt">
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Cut p95 latency 35%"
          className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] placeholder:text-[var(--ink-faint)]"
        />
      </Field>
      <STARField label="Situation" hint="Context & stakes" value={draft.situation} onChange={(v) => set({ situation: v })} />
      <STARField label="Task" hint="Your responsibility" value={draft.task} onChange={(v) => set({ task: v })} />
      <STARField label="Action" hint="What YOU did (use 'I')" value={draft.action} onChange={(v) => set({ action: v })} />
      <STARField label="Result" hint="Quantified outcome" value={draft.result} onChange={(v) => set({ result: v })} />

      <div className="flex gap-3 mt-2">
        <button
          onClick={onDelete}
          className="rounded-2xl bg-[var(--surface)] text-[var(--rose-ink)] font-semibold px-5 py-3.5 shadow-[var(--shadow-sm)] active:scale-[0.98] transition"
        >
          Delete
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-1 rounded-2xl bg-[var(--ink)] text-white font-semibold py-3.5 active:scale-[0.98] transition"
        >
          Save
        </button>
      </div>

      <button
        onClick={critique}
        disabled={busy}
        className="mt-3 w-full rounded-2xl bg-[var(--violet)] text-white font-semibold py-3.5 disabled:opacity-60 active:scale-[0.98] transition"
      >
        {busy ? "Reviewing…" : "✨ Get AI critique"}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--rose-ink)]">{error}</p>}

      {crit && (
        <div className="mt-4 fade-up">
          <div className="card p-5 text-white bg-[var(--ink)] flex items-center gap-4">
            <div
              className={`h-14 w-14 shrink-0 rounded-full grid place-items-center text-xl font-extrabold ${
                crit.score >= 75
                  ? "bg-[#2f8a5b]"
                  : crit.score >= 50
                    ? "bg-[#c08a3a]"
                    : "bg-[#b1607a]"
              }`}
            >
              {crit.score}
            </div>
            <p className="font-bold">Story strength</p>
          </div>
          {crit.strengths.length > 0 && (
            <div className="mt-3 card-flat p-4">
              <p className="text-xs font-bold text-[#2f8a5b] mb-2">✓ Strengths</p>
              <ul className="text-sm text-[var(--ink)] list-disc pl-4 space-y-1">
                {crit.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {crit.improvements.length > 0 && (
            <div className="mt-3 card-flat p-4">
              <p className="text-xs font-bold text-[#c08a3a] mb-2">
                ⚠ Improve
              </p>
              <ul className="text-sm text-[var(--ink)] list-disc pl-4 space-y-1">
                {crit.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {crit.rewrite && (
            <div className="mt-3 card-flat p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--violet-ink)] mb-2">
                Polished version
              </p>
              <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                {crit.rewrite}
              </p>
              <button
                onClick={() => {
                  addSaved({
                    type: "note",
                    title: `STAR: ${draft.title || "story"}`,
                    content: crit.rewrite,
                    tags: ["behavioral", "star"],
                  });
                  setSavedRw(true);
                  setTimeout(() => setSavedRw(false), 1500);
                }}
                className="mt-3 text-xs font-semibold text-[var(--violet-ink)]"
              >
                {savedRw ? "✓ Saved to notes" : "🔖 Save to notes"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold text-[var(--ink-soft)] mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function STARField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold text-[var(--ink-soft)] mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[var(--ink-faint)] font-normal">{hint}</span>
      </span>
      <textarea
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed"
      />
    </label>
  );
}
