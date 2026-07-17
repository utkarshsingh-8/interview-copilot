"use client";

import { useState } from "react";
import { readResume } from "@/lib/resumeStore";
import { addSaved } from "@/lib/notes";
import { logActivity } from "@/lib/activity";
import type { Question } from "@/lib/questions";

type Analysis = {
  matchScore: number;
  focus: string[];
  matched: string[];
  missing: string[];
  advice: string;
  questions: Question[];
};

export default function JDView() {
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [savedQ, setSavedQ] = useState<string | null>(null);

  async function analyze() {
    if (jd.trim().length < 60) {
      setError("Paste a fuller job description.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, company, resume: readResume() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data as Analysis);
      setOpenQ(null);
      logActivity("jd", company.trim() || "Job description", data.matchScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up">
      <p className="text-sm font-semibold text-[var(--violet-ink)]">
        Target a job
      </p>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
        JD &amp; company prep
      </h1>
      <p className="mt-2 text-[var(--ink-soft)] text-sm">
        Paste a job description. Get your match score, gaps, and the exact
        questions this interviewer is likely to ask.
      </p>

      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company (optional)"
        className="mt-5 w-full rounded-2xl bg-[var(--surface)] px-4 py-3.5 text-sm outline-none shadow-[var(--shadow-sm)] placeholder:text-[var(--ink-faint)]"
      />
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={7}
        placeholder="Paste the full job description here…"
        className="mt-3 w-full rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
      />
      <button
        onClick={analyze}
        disabled={busy}
        className="mt-3 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 disabled:opacity-60 active:scale-[0.98] transition"
      >
        {busy ? "Analyzing…" : result ? "Re-analyze" : "Analyze fit"}
      </button>
      {error && <p className="mt-3 text-sm text-[var(--rose-ink)]">{error}</p>}

      {result && (
        <div className="mt-6 fade-up">
          {/* match score */}
          <div className="card p-5 text-white bg-[var(--ink)] flex items-center gap-4">
            <div
              className={`h-16 w-16 shrink-0 rounded-full grid place-items-center text-2xl font-extrabold ${
                result.matchScore >= 70
                  ? "bg-[#2f8a5b]"
                  : result.matchScore >= 45
                    ? "bg-[#c08a3a]"
                    : "bg-[#b1607a]"
              }`}
            >
              {result.matchScore}
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase">
                Resume ↔ JD match
              </p>
              <p className="font-bold leading-snug">
                {result.matchScore >= 70
                  ? "Strong fit — apply"
                  : result.matchScore >= 45
                    ? "Decent fit — tailor it"
                    : "Stretch role"}
              </p>
            </div>
          </div>

          {result.focus.length > 0 && (
            <Section title="What this role emphasizes">
              <div className="flex flex-wrap gap-2">
                {result.focus.map((f, i) => (
                  <span
                    key={i}
                    className="pill bg-[var(--violet-soft)] text-[var(--violet-ink)] !text-xs"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <div className="grid grid-cols-1 gap-3 mt-4">
            {result.matched.length > 0 && (
              <div className="card-flat p-4">
                <p className="text-xs font-bold text-[#2f8a5b] mb-2">
                  ✓ You match on
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched.map((m, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold text-[var(--ink)] bg-[#e2f3ea] rounded-full px-2.5 py-1"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.missing.length > 0 && (
              <div className="card-flat p-4">
                <p className="text-xs font-bold text-[#c08a3a] mb-2">
                  ⚠ Shore up / study
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing.map((m, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold text-[var(--ink)] bg-[#fdf1e3] rounded-full px-2.5 py-1"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.advice && (
            <Section title="How to position yourself">
              <p className="text-sm leading-relaxed text-[var(--ink)]">
                {result.advice}
              </p>
            </Section>
          )}

          {result.questions.length > 0 && (
            <>
              <h2 className="text-lg font-extrabold text-[var(--ink)] mt-7 mb-3">
                Likely questions
              </h2>
              <div className="flex flex-col gap-3">
                {result.questions.map((q) => {
                  const open = openQ === q.id;
                  return (
                    <div key={q.id} className="card-flat overflow-hidden">
                      <button
                        onClick={() => setOpenQ(open ? null : q.id)}
                        className="w-full text-left px-4 py-4 flex gap-3 items-start"
                      >
                        <p className="flex-1 font-semibold text-[15px] leading-snug text-[var(--ink)]">
                          {q.question}
                        </p>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          className={`mt-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="#9a95ac"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <div className={`accordion ${open ? "open" : ""}`}>
                        <div>
                          <div className="px-4 pb-4">
                            <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                              <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                                {q.answer}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                addSaved({
                                  type: "qa",
                                  title: q.question,
                                  content: q.answer,
                                  tags: [company || "JD", ...q.tags].slice(0, 5),
                                });
                                setSavedQ(q.id);
                                setTimeout(
                                  () => setSavedQ((s) => (s === q.id ? null : s)),
                                  1500
                                );
                              }}
                              className="mt-3 text-xs font-semibold text-[var(--violet-ink)]"
                            >
                              {savedQ === q.id ? "✓ Saved to notes" : "🔖 Save answer"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
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
    <div className="mt-4">
      <h2 className="text-sm font-extrabold text-[var(--ink)] mb-2">{title}</h2>
      <div className="card-flat p-4">{children}</div>
    </div>
  );
}
