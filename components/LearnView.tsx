"use client";
import { authedFetch } from "@/lib/authedFetch";

import { useRef, useState } from "react";
import { readResume } from "@/lib/resumeStore";
import { addSaved } from "@/lib/notes";
import { logActivity } from "@/lib/activity";
import { toolGroups } from "@/lib/aiTools";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain RAG like I'm in an interview",
  "What is LoRA vs full fine-tuning?",
  "How does a vector database work?",
  "Explain KV cache in LLM serving",
  "What is reciprocal rank fusion?",
  "Redis caching strategies",
];

export default function LearnView() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [seg, setSeg] = useState<"ask" | "tools">("ask");
  const endRef = useRef<HTMLDivElement>(null);

  function saveAnswer(i: number) {
    const answer = messages[i]?.content ?? "";
    const question = messages[i - 1]?.content ?? "Learned concept";
    addSaved({ type: "learn", title: question, content: answer });
    setSavedIdx(i);
    setTimeout(() => setSavedIdx((s) => (s === i ? null : s)), 1500);
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setBusy(true);
    try {
      const res = await authedFetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, resume: readResume() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      logActivity("learn", question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        60
      );
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="fade-up flex flex-col min-h-[calc(100dvh-8rem)]">
      <div>
        <p className="text-sm font-semibold text-[var(--violet-ink)]">
          AI Mentor
        </p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
          {seg === "ask" ? "Learn anything" : "AI tool map"}
        </h1>
      </div>

      {/* segments */}
      <div className="mt-4 flex gap-1 p-1 rounded-2xl bg-[var(--surface-muted)]">
        {(["ask", "tools"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeg(s)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              seg === s
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-soft)]"
            }`}
          >
            {s === "ask" ? "Ask AI" : "AI Tools"}
          </button>
        ))}
      </div>

      {seg === "tools" ? (
        <ToolsDirectory
          onAsk={(q) => {
            setSeg("ask");
            ask(q);
          }}
        />
      ) : empty ? (
        <div className="mt-6">
          <div className="card p-5">
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              Ask me any AI, backend, or system-design concept and I&apos;ll
              explain it interview-style — with an analogy, the technical depth,
              a code snippet, and likely follow-up questions.
            </p>
          </div>
          <p className="mt-6 text-xs font-semibold text-[var(--ink-soft)] mb-2">
            Try one of these
          </p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="card-flat px-4 py-3 text-left text-sm font-medium text-[var(--ink)] active:scale-[0.99] transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 flex-1 flex flex-col gap-3">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-3 text-sm"
              >
                {m.content}
              </div>
            ) : (
              <div key={i} className="self-start max-w-[92%]">
                <div className="card-flat px-4 py-3 text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                  {m.content}
                </div>
                <button
                  onClick={() => saveAnswer(i)}
                  className="mt-1.5 ml-1 text-xs font-semibold text-[var(--violet-ink)] active:scale-95 transition"
                >
                  {savedIdx === i ? "✓ Saved to notes" : "🔖 Save"}
                </button>
              </div>
            )
          )}
          {busy && (
            <div className="self-start card-flat px-4 py-3">
              <div className="flex gap-1">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-[var(--rose-ink)] text-center">
          {error}
        </p>
      )}

      {/* composer */}
      {seg === "ask" && (
        <div className="sticky bottom-24 mt-4">
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Ask a concept…"
              className="flex-1 bg-transparent outline-none text-[15px] px-2 placeholder:text-[var(--ink-faint)]"
            />
            <button
              onClick={() => ask(input)}
              disabled={busy || !input.trim()}
              className="h-10 w-10 rounded-xl bg-[var(--accent)] grid place-items-center disabled:opacity-40 active:scale-95 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12h14M12 5l7 7-7 7"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsDirectory({ onAsk }: { onAsk: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = toolGroups
    .map((g) => ({
      ...g,
      tools: g.tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.what.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.tools.length > 0);

  return (
    <div className="fade-up mt-5">
      <p className="text-xs text-[var(--ink-soft)] mb-3 leading-relaxed">
        The current AI tooling landscape — what exists and what it&apos;s for.
        <span className="text-[var(--violet-ink)] font-semibold">
          {" "}
          Purple dot
        </span>{" "}
        = already on your resume; the rest is your &ldquo;what to learn
        next&rdquo; list. Tap a tool to open its docs, or ask the mentor.
      </p>

      <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)] mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="var(--ink-faint)" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vLLM, guardrails, eval…"
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-[var(--ink-faint)]"
        />
      </div>

      <div className="flex flex-col gap-5 pb-4">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="text-xs font-bold text-[var(--ink-soft)] mb-2">
              {g.emoji} {g.group}
            </p>
            <div className="flex flex-col gap-2">
              {g.tools.map((t) => (
                <div key={t.name} className="card-flat p-3.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {t.known && (
                          <span className="h-2 w-2 rounded-full bg-[var(--violet)] shrink-0" />
                        )}
                        <p className="font-bold text-sm text-[var(--ink)]">
                          {t.name}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] mt-0.5 leading-relaxed">
                        {t.what}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="pill !py-1.5 !px-3 !text-[11px] bg-[var(--surface-muted)] text-[var(--ink-soft)]"
                    >
                      Docs ↗
                    </a>
                    <button
                      onClick={() =>
                        onAsk(
                          `Explain ${t.name} — what it is, when to use it, how it compares to alternatives, and what an interviewer might ask me about it.`
                        )
                      }
                      className="pill !py-1.5 !px-3 !text-[11px] bg-[var(--violet-soft)] text-[var(--violet-ink)]"
                    >
                      Ask mentor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)] text-center py-6">
            No tool matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full bg-[var(--ink-faint)] animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
