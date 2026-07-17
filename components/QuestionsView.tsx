"use client";

import { useMemo, useState } from "react";
import {
  categoryMeta,
  difficultyMeta,
  questions as seedQuestions,
  type Category,
  type Difficulty,
  type Question,
} from "@/lib/questions";
import { useProgress, type Confidence } from "@/lib/progress";

const categories = Object.keys(categoryMeta) as Category[];
const difficulties = Object.keys(difficultyMeta) as Difficulty[];

const diffColor: Record<Difficulty, string> = {
  beginner: "bg-[#e2f3ea] text-[#2f8a5b]",
  intermediate: "bg-[#e7eefb] text-[#3a6bd0]",
  advanced: "bg-[#f3e9fb] text-[#8a4fc0]",
  staff: "bg-[#fbe6ec] text-[#b1607a]",
};

export default function QuestionsView() {
  const [list, setList] = useState<Question[]>(seedQuestions);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [diff, setDiff] = useState<Difficulty | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [genCat, setGenCat] = useState<Category>("genai");
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const { progress, markPracticed, unmarkPracticed } = useProgress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (diff !== "all" && item.difficulty !== diff) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [list, query, cat, diff]);

  async function generateMore() {
    setGenBusy(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: genCat, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (Array.isArray(data.questions) && data.questions.length) {
        setList((prev) => [...data.questions, ...prev]);
        setCat(genCat);
      } else {
        setGenError("No questions returned.");
      }
    } catch (e) {
      setGenError(
        e instanceof Error ? e.message : "Could not generate questions."
      );
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="fade-up">
      {/* header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--violet-ink)]">
            Interview Prep
          </p>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
            Questions &amp; Answers
          </h1>
        </div>
        <span className="pill bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]">
          {filtered.length}
        </span>
      </div>

      {/* search */}
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#9a95ac" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="#9a95ac" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search RAG, LoRA, caching…"
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-[var(--ink-faint)]"
        />
      </div>

      {/* category filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <FilterPill active={cat === "all"} onClick={() => setCat("all")}>
          All
        </FilterPill>
        {categories.map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
            <span className="mr-1">{categoryMeta[c].emoji}</span>
            {categoryMeta[c].label}
          </FilterPill>
        ))}
      </div>

      {/* difficulty filters */}
      <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <FilterPill small active={diff === "all"} onClick={() => setDiff("all")}>
          Any level
        </FilterPill>
        {difficulties.map((d) => (
          <FilterPill
            key={d}
            small
            active={diff === d}
            onClick={() => setDiff(d)}
          >
            {difficultyMeta[d].label}
          </FilterPill>
        ))}
      </div>

      {/* AI generate */}
      <div className="mt-4 card-flat p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--ink)]">
              Need harder ones?
            </p>
            <p className="text-xs text-[var(--ink-soft)]">
              Generate fresh questions from your resume with AI.
            </p>
          </div>
          <button
            onClick={generateMore}
            disabled={genBusy}
            className="shrink-0 rounded-xl bg-[var(--ink)] text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-50 active:scale-95 transition"
          >
            {genBusy ? "Thinking…" : "Generate"}
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <FilterPill
              key={c}
              small
              active={genCat === c}
              onClick={() => setGenCat(c)}
            >
              {categoryMeta[c].label}
            </FilterPill>
          ))}
        </div>
        {genError && (
          <p className="mt-2 text-xs text-[var(--rose-ink)]">{genError}</p>
        )}
      </div>

      {/* list */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((item) => {
          const open = openId === item.id;
          const conf = progress.practiced[item.id];
          return (
            <div key={item.id} className="card-flat overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : item.id)}
                className="w-full text-left px-4 py-4 flex gap-3 items-start"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`pill !py-1 !px-2.5 !text-[11px] ${diffColor[item.difficulty]}`}
                    >
                      {difficultyMeta[item.difficulty].label}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--ink-faint)]">
                      {categoryMeta[item.category].emoji}{" "}
                      {categoryMeta[item.category].label}
                    </span>
                    {conf && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[var(--violet)]" />
                    )}
                  </div>
                  <p className="font-semibold text-[15px] leading-snug text-[var(--ink)]">
                    {item.question}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
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
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--violet-ink)] mb-2">
                        Model answer
                      </p>
                      <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                        {item.answer}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-semibold text-[var(--ink-faint)] bg-[var(--surface)] rounded-full px-2 py-1"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* practiced controls */}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-[var(--ink-soft)] mb-2">
                        How confident are you?
                      </p>
                      <div className="flex gap-2">
                        {(["low", "medium", "high"] as Confidence[]).map((c) => (
                          <button
                            key={c}
                            onClick={() =>
                              conf === c
                                ? unmarkPracticed(item.id)
                                : markPracticed(item.id, c)
                            }
                            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition active:scale-95 ${
                              conf === c
                                ? "bg-[var(--ink)] text-white"
                                : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"
                            }`}
                          >
                            {c === "low"
                              ? "Shaky"
                              : c === "medium"
                                ? "Okay"
                                : "Solid"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card-flat p-8 text-center">
            <p className="text-sm text-[var(--ink-soft)]">
              No questions match. Try clearing filters or generating new ones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`pill ${small ? "!py-1.5 !px-3 !text-xs" : ""} ${
        active
          ? "bg-[var(--ink)] text-white"
          : "bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]"
      }`}
    >
      {children}
    </button>
  );
}
