"use client";

import { useMemo, useState } from "react";
import { useNotes, type SavedType } from "@/lib/notes";

const typeMeta: Record<SavedType, { label: string; emoji: string; color: string }> = {
  learn: { label: "Learned", emoji: "📚", color: "bg-[#e7eefb] text-[#3a6bd0]" },
  qa: { label: "Q&A", emoji: "💬", color: "bg-[#f3e9fb] text-[#8a4fc0]" },
  note: { label: "Note", emoji: "📝", color: "bg-[#e2f3ea] text-[#2f8a5b]" },
};

const filters: ("all" | SavedType)[] = ["all", "learn", "qa", "note"];

export default function SavedView() {
  const { notes, remove, add } = useNotes();
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
          className="h-11 w-11 rounded-full bg-[var(--ink)] text-white grid place-items-center text-xl active:scale-95 transition"
          aria-label="New note"
        >
          {composing ? "✕" : "+"}
        </button>
      </div>

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
            className="mt-2 w-full rounded-xl bg-[var(--ink)] text-white text-sm font-semibold py-3 active:scale-[0.98] transition"
          >
            Save note
          </button>
        </div>
      )}

      {/* search */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#9a95ac" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="#9a95ac" strokeWidth="2" strokeLinecap="round" />
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
                ? "bg-[var(--ink)] text-white"
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
