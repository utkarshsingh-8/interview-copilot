"use client";

import { useRef, useState } from "react";
import { readResume } from "@/lib/resumeStore";

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
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, resume: readResume() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
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
          Learn anything
        </h1>
      </div>

      {empty ? (
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
                className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-[var(--ink)] text-white px-4 py-3 text-sm"
              >
                {m.content}
              </div>
            ) : (
              <div
                key={i}
                className="self-start max-w-[92%] card-flat px-4 py-3 text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line"
              >
                {m.content}
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
            className="h-10 w-10 rounded-xl bg-[var(--ink)] grid place-items-center disabled:opacity-40 active:scale-95 transition"
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
