"use client";

import { useMemo, useState } from "react";
import { useNotes, type SavedItem, type SavedType } from "@/lib/notes";
import { useSR, review as srReview, type SRGrade } from "@/lib/sr";

const typeMeta: Record<SavedType, { label: string; emoji: string; color: string }> = {
  learn: { label: "Learned", emoji: "📚", color: "bg-[#e7eefb] text-[#3a6bd0]" },
  qa: { label: "Q&A", emoji: "💬", color: "bg-[#f3e9fb] text-[#8a4fc0]" },
  note: { label: "Note", emoji: "📝", color: "bg-[#e2f3ea] text-[#2f8a5b]" },
};

const filters: ("all" | SavedType)[] = ["all", "learn", "qa", "note"];

export default function SavedView() {
  const { notes, remove, add } = useNotes();
  const { dueList } = useSR();
  const [reviewing, setReviewing] = useState(false);
  const [rIdx, setRIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [queue, setQueue] = useState<SavedItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SavedType>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter !== "all" && n.type !== filter) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [notes, query, filter]);

  const dueNotes = useMemo(() => {
    const ids = new Set(dueList(notes.map((n) => n.id)));
    return notes.filter((n) => ids.has(n.id));
  }, [notes, dueList]);

  function saveNote() {
    if (!nTitle.trim() && !nBody.trim()) return;
    add({
      type: "note",
      title: nTitle.trim() || "Untitled note",
      content: nBody.trim(),
    });
    setNTitle("");
    setNBody("");
    setComposing(false);
  }

  function startReview() {
    if (dueNotes.length === 0) return;
    setQueue(dueNotes);
    setRIdx(0);
    setFlipped(false);
    setReviewing(true);
  }

  function grade(g: SRGrade) {
    const item = queue[rIdx];
    if (item) srReview(item.id, g);
    if (rIdx + 1 >= queue.length) {
      setReviewing(false);
    } else {
      setRIdx(rIdx + 1);
      setFlipped(false);
    }
  }

  // ---------- REVIEW MODE ----------
  if (reviewing && queue[rIdx]) {
    const item = queue[rIdx];
    return (
      <div className="fade-up">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setReviewing(false)}
            className="text-sm font-semibold text-[var(--ink-soft)]"
          >
            ✕ End review
          </button>
          <span className="pill bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]">
            {rIdx + 1} / {queue.length}
          </span>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--surface)] overflow-hidden">
          <div
            className="h-full bg-[var(--violet)] transition-all"
            style={{ width: `${(rIdx / queue.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 card p-6 min-h-[40vh] flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--violet-ink)]">
            Recall this
          </span>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-[var(--ink)]">
            {item.title}
          </h2>
          {flipped ? (
            <div className="mt-4 fade-up flex-1">
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                  {item.content || "(no detail saved)"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center">
              <button
                onClick={() => setFlipped(true)}
                className="rounded-2xl bg-[var(--accent)] text-white font-semibold px-6 py-3 active:scale-95 transition"
              >
                Show answer
              </button>
            </div>
          )}
        </div>

        {flipped && (
          <div className="mt-4 grid grid-cols-4 gap-2 fade-up">
            {(
              [
                ["again", "Again", "bg-[#fbe6ec] text-[#b1607a]"],
                ["hard", "Hard", "bg-[#fdf1e3] text-[#c08a3a]"],
                ["good", "Good", "bg-[#e7eefb] text-[#3a6bd0]"],
                ["easy", "Easy", "bg-[#e2f3ea] text-[#2f8a5b]"],
              ] as [SRGrade, string, string][]
            ).map(([g, label, color]) => (
              <button
                key={g}
                onClick={() => grade(g)}
                className={`rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-[var(--ink-faint)]">
          Rate honestly — weak cards come back sooner.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--violet-ink)]">
            Revision
          </p>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
            Saved &amp; notes
          </h1>
        </div>
        <button
          onClick={() => setComposing((v) => !v)}
          className="h-11 w-11 rounded-full bg-[var(--accent)] text-white grid place-items-center text-xl active:scale-95 transition"
          aria-label="New note"
        >
          {composing ? "✕" : "+"}
        </button>
      </div>

      {notes.length > 0 && (
        <button
          onClick={startReview}
          disabled={dueNotes.length === 0}
          className={`mt-4 w-full card p-4 flex items-center gap-3 text-left transition active:scale-[0.99] ${
            dueNotes.length ? "bg-[var(--violet)] text-white" : ""
          }`}
        >
          <span className="text-2xl">🔁</span>
          <div className="flex-1">
            <p className={`font-bold text-sm ${dueNotes.length ? "" : "text-[var(--ink)]"}`}>
              {dueNotes.length
                ? `Review ${dueNotes.length} due`
                : "All caught up 🎉"}
            </p>
            <p
              className={`text-xs ${dueNotes.length ? "text-white/80" : "text-[var(--ink-faint)]"}`}
            >
              Spaced repetition — resurfaces what you're weakest on
            </p>
          </div>
          {dueNotes.length > 0 && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {composing && (
        <div className="mt-4 card p-4 fade-up">
          <input
            value={nTitle}
            onChange={(e) => setNTitle(e.target.value)}
            placeholder="Note title"
            className="w-full bg-[var(--surface-muted)] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none mb-2 placeholder:text-[var(--ink-faint)]"
          />
          <textarea
            value={nBody}
            onChange={(e) => setNBody(e.target.value)}
            rows={4}
            placeholder="Write anything you want to remember for interviews…"
            className="w-full bg-[var(--surface-muted)] rounded-xl px-3 py-2.5 text-sm outline-none resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
          />
          <button
            onClick={saveNote}
            className="mt-2 w-full rounded-xl bg-[var(--accent)] text-white text-sm font-semibold py-3 active:scale-[0.98] transition"
          >
            Save note
          </button>
        </div>
      )}

      {/* search */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="var(--ink-faint)" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your saved material…"
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-[var(--ink-faint)]"
        />
      </div>

      {/* filters */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pill !py-1.5 !px-3 !text-xs ${
              filter === f
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)]"
            }`}
          >
            {f === "all" ? "All" : `${typeMeta[f].emoji} ${typeMeta[f].label}`}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((n) => {
          const open = openId === n.id;
          const m = typeMeta[n.type];
          return (
            <div key={n.id} className="card-flat overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : n.id)}
                className="w-full text-left px-4 py-4 flex gap-3 items-start"
              >
                <div className="flex-1 min-w-0">
                  <span className={`pill !py-1 !px-2.5 !text-[11px] ${m.color} mb-2`}>
                    {m.emoji} {m.label}
                  </span>
                  <p className="font-semibold text-[15px] leading-snug text-[var(--ink)]">
                    {n.title}
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
                    stroke="var(--ink-faint)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className={`accordion ${open ? "open" : ""}`}>
                <div>
                  <div className="px-4 pb-4">
                    {n.content && (
                      <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                        <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                          {n.content}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-[var(--ink-faint)]">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => remove(n.id)}
                        className="text-xs font-semibold text-[var(--rose-ink)]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card-flat p-8 text-center">
            <p className="text-4xl mb-3">🔖</p>
            <p className="text-sm text-[var(--ink-soft)]">
              {notes.length === 0
                ? "Nothing saved yet. Tap Save on any Learn answer or Q&A, or add a note with +."
                : "No matches. Try a different search or filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
