"use client";

import { useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { readResume } from "@/lib/resumeStore";
import { addSaved } from "@/lib/notes";
import {
  stageMeta,
  useApplications,
  type Application,
  type Stage,
} from "@/lib/applications";

type JDAnalysis = {
  matchScore: number;
  focus: string[];
  matched: string[];
  missing: string[];
  advice: string;
  questions: { id: string; question: string; answer: string; tags: string[] }[];
};

const stages = Object.keys(stageMeta) as Stage[];
const activeStages: Stage[] = ["wishlist", "applied", "oa", "phone", "onsite"];

export default function ApplicationsView() {
  const { apps, save, remove, create } = useApplications();
  const [editing, setEditing] = useState<Application | null>(null);

  const sorted = useMemo(
    () =>
      [...apps].sort(
        (a, b) =>
          stageMeta[a.stage].order - stageMeta[b.stage].order ||
          b.updatedAt.localeCompare(a.updatedAt)
      ),
    [apps]
  );

  const activeCount = apps.filter((a) =>
    activeStages.includes(a.stage)
  ).length;
  const offers = apps.filter((a) => a.stage === "offer").length;

  if (editing) {
    return (
      <Editor
        app={editing}
        onSave={(a) => {
          save(a);
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
      {/* summary */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <MiniStat value={apps.length} label="Total" />
        <MiniStat value={activeCount} label="Active" />
        <MiniStat value={offers} label="Offers" rose />
      </div>

      <button
        onClick={() => setEditing(create())}
        className="mt-4 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-3.5 active:scale-[0.98] transition"
      >
        + Add application
      </button>

      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((a) => (
          <button
            key={a.id}
            onClick={() => setEditing(a)}
            className="card-flat p-4 text-left active:scale-[0.99] transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[15px] text-[var(--ink)] truncate">
                  {a.company || "Untitled"}
                </p>
                <p className="text-sm text-[var(--ink-soft)] truncate">
                  {a.role || "—"}
                </p>
              </div>
              <span
                className={`pill !py-1 !px-2.5 !text-[11px] shrink-0 ${stageMeta[a.stage].color}`}
              >
                {stageMeta[a.stage].label}
              </span>
            </div>
            {a.nextAction && (
              <p className="mt-2 text-xs text-[var(--violet-ink)] font-semibold">
                → {a.nextAction}
              </p>
            )}
          </button>
        ))}

        {apps.length === 0 && (
          <div className="card-flat p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Track every application here — company, stage, and your next
              action so nothing slips.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Editor({
  app,
  onSave,
  onDelete,
  onCancel,
}: {
  app: Application;
  onSave: (a: Application) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Application>(app);
  const set = (patch: Partial<Application>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const [jdBusy, setJdBusy] = useState(false);
  const [jdErr, setJdErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [savedQ, setSavedQ] = useState<string | null>(null);

  async function analyzeJD() {
    if ((draft.jd || "").trim().length < 60) {
      setJdErr("Paste a fuller job description first.");
      return;
    }
    setJdBusy(true);
    setJdErr(null);
    try {
      const res = await authedFetch("/api/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: draft.jd,
          company: draft.company,
          resume: readResume(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data as JDAnalysis);
    } catch (e) {
      setJdErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setJdBusy(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">
          {app.company ? "Edit" : "New application"}
        </h2>
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-[var(--ink-soft)]"
        >
          Cancel
        </button>
      </div>

      <Field label="Company">
        <Input value={draft.company} onChange={(v) => set({ company: v })} placeholder="e.g. Anthropic" />
      </Field>
      <Field label="Role">
        <Input value={draft.role} onChange={(v) => set({ role: v })} placeholder="e.g. AI Engineer" />
      </Field>

      <Field label="Stage">
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => set({ stage: s })}
              className={`pill !text-xs ${
                draft.stage === s
                  ? "bg-[var(--ink)] text-white"
                  : `${stageMeta[s].color}`
              }`}
            >
              {stageMeta[s].label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Job link">
        <Input value={draft.url} onChange={(v) => set({ url: v })} placeholder="https://…" />
      </Field>
      <Field label="Next action">
        <Input
          value={draft.nextAction}
          onChange={(v) => set({ nextAction: v })}
          placeholder="e.g. Follow up Fri, prep system design"
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={4}
          placeholder="Recruiter name, referral, interviewers, learnings…"
          className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
        />
      </Field>

      {/* JD & prep for this role */}
      <Field label="Job description (for AI prep)">
        <textarea
          value={draft.jd}
          onChange={(e) => set({ jd: e.target.value })}
          rows={4}
          placeholder="Paste the JD to get a match score & likely questions for this specific role…"
          className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
        />
      </Field>
      <button
        onClick={analyzeJD}
        disabled={jdBusy}
        className="w-full rounded-2xl bg-[var(--violet)] text-white font-semibold py-3.5 disabled:opacity-60 active:scale-[0.98] transition mb-3"
      >
        {jdBusy ? "Analyzing…" : "🎯 Analyze fit & get questions"}
      </button>
      {jdErr && <p className="mb-3 text-sm text-[var(--rose-ink)]">{jdErr}</p>}

      {analysis && (
        <div className="mb-4 fade-up">
          <div className="card p-4 text-white bg-[var(--ink)] flex items-center gap-3">
            <div
              className={`h-12 w-12 shrink-0 rounded-full grid place-items-center text-lg font-extrabold ${
                analysis.matchScore >= 70
                  ? "bg-[#2f8a5b]"
                  : analysis.matchScore >= 45
                    ? "bg-[#c08a3a]"
                    : "bg-[#b1607a]"
              }`}
            >
              {analysis.matchScore}
            </div>
            <p className="font-bold text-sm">Match for this role</p>
          </div>
          {analysis.missing.length > 0 && (
            <div className="mt-2 card-flat p-3">
              <p className="text-xs font-bold text-[#c08a3a] mb-1.5">
                ⚠ Shore up
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missing.map((m, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold text-[var(--ink)] bg-[#fdf1e3] rounded-full px-2 py-0.5"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.questions.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {analysis.questions.map((q) => (
                <div key={q.id} className="card-flat p-3">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {q.question}
                  </p>
                  <button
                    onClick={() => {
                      addSaved({
                        type: "qa",
                        title: q.question,
                        content: q.answer,
                        tags: [draft.company || "role", ...(q.tags || [])].slice(0, 5),
                      });
                      setSavedQ(q.id);
                      setTimeout(
                        () => setSavedQ((s) => (s === q.id ? null : s)),
                        1500
                      );
                    }}
                    className="mt-2 text-xs font-semibold text-[var(--violet-ink)]"
                  >
                    {savedQ === q.id ? "✓ Saved" : "🔖 Save answer"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
            Tip: hit Save below to keep this JD with the application.
          </p>
        </div>
      )}

      {draft.url && (
        <a
          href={draft.url}
          target="_blank"
          rel="noreferrer"
          className="block text-sm font-semibold text-[var(--violet-ink)] mb-4"
        >
          Open job posting ↗
        </a>
      )}

      <div className="flex gap-3">
        <button
          onClick={onDelete}
          className="rounded-2xl bg-[var(--surface)] text-[var(--rose-ink)] font-semibold px-5 py-4 shadow-[var(--shadow-sm)] active:scale-[0.98] transition"
        >
          Delete
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-1 rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 active:scale-[0.98] transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  value,
  label,
  rose,
}: {
  value: number;
  label: string;
  rose?: boolean;
}) {
  return (
    <div className="card-flat p-3 text-center" style={rose ? { background: "var(--rose)" } : undefined}>
      <p className="text-2xl font-extrabold text-[var(--ink)]">{value}</p>
      <p className="text-[11px] font-semibold text-[var(--ink-soft)]">{label}</p>
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

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] placeholder:text-[var(--ink-faint)]"
    />
  );
}
