"use client";

import { useMemo, useState } from "react";
import {
  categoryMeta,
  questions as allQuestions,
  type Category,
  type Question,
} from "@/lib/questions";
import { useProgress } from "@/lib/progress";

type InterviewType = {
  key: string;
  label: string;
  emoji: string;
  cats: Category[];
  desc: string;
};

const TYPES: InterviewType[] = [
  { key: "hr", label: "HR Round", emoji: "🤝", cats: ["intro", "behavioral"], desc: "Story, motivation, fit" },
  { key: "ai", label: "AI Engineering", emoji: "🧠", cats: ["genai"], desc: "RAG, fine-tuning, serving" },
  { key: "backend", label: "Backend", emoji: "⚙️", cats: ["backend"], desc: "APIs, caching, DBs" },
  { key: "llm", label: "LLM Deep Dive", emoji: "🪄", cats: ["genai"], desc: "Embeddings, eval, LoRA" },
  { key: "sd", label: "System Design", emoji: "🏗️", cats: ["systemdesign", "genai"], desc: "Scale & trade-offs" },
  { key: "proj", label: "Project Round", emoji: "🛠️", cats: ["project"], desc: "Defend your projects" },
  { key: "hm", label: "Hiring Manager", emoji: "👔", cats: ["intro", "project", "behavioral"], desc: "Impact & ownership" },
];

const RATINGS = [
  { key: "missed", label: "Missed", score: 0, color: "bg-[#fbe6ec] text-[#b1607a]" },
  { key: "partial", label: "Partial", score: 55, color: "bg-[#fdf1e3] text-[#c08a3a]" },
  { key: "strong", label: "Strong", score: 100, color: "bg-[#e2f3ea] text-[#2f8a5b]" },
] as const;

function pick(cats: Category[], n: number): Question[] {
  const pool = allQuestions.filter((q) => cats.includes(q.category));
  // spread across difficulty, cap at n
  const shuffled = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

type Phase = "pick" | "run" | "done";

export default function MockView() {
  const { progress, addMockSession } = useProgress();
  const [phase, setPhase] = useState<Phase>("pick");
  const [type, setType] = useState<InterviewType | null>(null);
  const [set, setSet] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  const start = (t: InterviewType) => {
    const qs = pick(t.cats, 5);
    setType(t);
    setSet(qs);
    setIdx(0);
    setRevealed(false);
    setScores([]);
    setPhase("run");
  };

  const rate = (score: number) => {
    const next = [...scores, score];
    setScores(next);
    if (idx + 1 >= set.length) {
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
      addMockSession({ type: type!.label, score: avg });
      setPhase("done");
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
  };

  const finalScore = useMemo(
    () =>
      scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    [scores]
  );

  // ---------- PICK ----------
  if (phase === "pick") {
    return (
      <div className="fade-up">
        <p className="text-sm font-semibold text-[var(--violet-ink)]">
          Mock Interview
        </p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
          Pick a round
        </h1>
        <p className="mt-2 text-[var(--ink-soft)] text-sm">
          5 questions, self-rate each, get a score. Grounded in your resume.
        </p>

        {progress.mockSessions.length > 0 && (
          <div className="mt-5 card-flat p-4">
            <p className="text-xs font-semibold text-[var(--ink-soft)] mb-2">
              Recent sessions
            </p>
            <div className="flex flex-col gap-2">
              {progress.mockSessions.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--ink)]">
                    {m.type}
                  </span>
                  <span className="text-sm font-bold text-[var(--violet-ink)]">
                    {m.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => start(t)}
              className="card-flat p-4 text-left active:scale-[0.98] transition"
            >
              <div className="h-11 w-11 rounded-2xl bg-[var(--violet-soft)] grid place-items-center text-xl mb-3">
                {t.emoji}
              </div>
              <p className="font-bold text-[15px] text-[var(--ink)]">
                {t.label}
              </p>
              <p className="text-xs text-[var(--ink-faint)] mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- RUN ----------
  if (phase === "run" && type) {
    const q = set[idx];
    return (
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPhase("pick")}
            className="text-sm font-semibold text-[var(--ink-soft)]"
          >
            ✕ End
          </button>
          <span className="pill bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]">
            {idx + 1} / {set.length}
          </span>
        </div>

        {/* progress bar */}
        <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--surface)] overflow-hidden">
          <div
            className="h-full bg-[var(--violet)] transition-all"
            style={{ width: `${(idx / set.length) * 100}%` }}
          />
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold text-[var(--violet-ink)]">
            {type.emoji} {type.label} · {categoryMeta[q.category].label}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold leading-snug text-[var(--ink)]">
            {q.question}
          </h2>
        </div>

        {!revealed ? (
          <div className="mt-8 card p-6 text-center">
            <p className="text-sm text-[var(--ink-soft)]">
              Answer out loud like a real interview. When you&apos;re done,
              reveal the model answer and rate yourself honestly.
            </p>
            <button
              onClick={() => setRevealed(true)}
              className="mt-5 w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 active:scale-[0.98] transition"
            >
              Reveal model answer
            </button>
          </div>
        ) : (
          <div className="mt-6 fade-up">
            <div className="card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--violet-ink)] mb-2">
                Model answer
              </p>
              <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                {q.answer}
              </p>
            </div>
            <p className="mt-5 text-sm font-semibold text-[var(--ink-soft)] text-center">
              How did your answer compare?
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => rate(r.score)}
                  className={`rounded-2xl py-4 font-bold text-sm active:scale-95 transition ${r.color}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- DONE ----------
  return (
    <div className="fade-up flex flex-col items-center text-center pt-8">
      <div className="h-28 w-28 rounded-full bg-[var(--ink)] text-white grid place-items-center shadow-[var(--shadow)]">
        <span className="text-4xl font-extrabold">{finalScore}</span>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-[var(--ink)]">
        {finalScore >= 75
          ? "Strong round 🔥"
          : finalScore >= 50
            ? "Solid effort 💪"
            : "Good practice 📚"}
      </h1>
      <p className="mt-2 text-[var(--ink-soft)] text-sm">
        {type?.label} · {set.length} questions
      </p>

      <div className="mt-6 w-full card-flat p-5 text-left">
        <p className="text-sm font-bold text-[var(--ink)] mb-3">Breakdown</p>
        <div className="flex flex-col gap-2">
          {set.map((q, i) => (
            <div key={q.id} className="flex items-center gap-3">
              <span className="text-xs w-6 text-[var(--ink-faint)]">
                Q{i + 1}
              </span>
              <span className="text-sm flex-1 truncate text-[var(--ink)]">
                {q.question}
              </span>
              <span
                className={`text-xs font-bold ${
                  scores[i] >= 75
                    ? "text-[#2f8a5b]"
                    : scores[i] >= 50
                      ? "text-[#c08a3a]"
                      : "text-[#b1607a]"
                }`}
              >
                {scores[i]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 w-full flex flex-col gap-3">
        <button
          onClick={() => type && start(type)}
          className="w-full rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 active:scale-[0.98] transition"
        >
          Retry this round
        </button>
        <button
          onClick={() => setPhase("pick")}
          className="w-full rounded-2xl bg-[var(--surface)] text-[var(--ink)] font-semibold py-4 shadow-[var(--shadow-sm)] active:scale-[0.98] transition"
        >
          Choose another round
        </button>
      </div>
    </div>
  );
}
