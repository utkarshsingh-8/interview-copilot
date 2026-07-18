"use client";
import { authedFetch } from "@/lib/authedFetch";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  categoryMeta,
  questions as allQuestions,
  type Category,
  type Question,
} from "@/lib/questions";

type GradeResult = {
  score: number;
  verdict: string;
  strengths: string[];
  missing: string[];
  better: string;
};
import { useProgress } from "@/lib/progress";
import { readResume } from "@/lib/resumeStore";
import { addSaved } from "@/lib/notes";

type InterviewType = {
  key: string;
  label: string;
  emoji: string;
  cats: Category[];
  desc: string;
};

// Skill / domain topics for topic-based mock rounds (AI-generated questions),
// grouped for easy browsing. Search filters across every group.
const TOPIC_GROUPS: { group: string; emoji: string; topics: string[] }[] = [
  {
    group: "GenAI & LLMs",
    emoji: "🧠",
    topics: [
      "Generative AI",
      "Transformers",
      "Attention Mechanism",
      "Tokenization",
      "Embeddings",
      "Context Windows",
      "Prompt Engineering",
      "Function Calling / Tool Use",
      "Model Context Protocol (MCP)",
      "Multimodal Models",
      "Hallucination Mitigation",
      "Guardrails & Safety",
      "Prompt Injection",
    ],
  },
  {
    group: "RAG & Retrieval",
    emoji: "🔎",
    topics: [
      "Retrieval-Augmented Generation (RAG)",
      "Vector Databases",
      "Hybrid Search",
      "Reranking",
      "Chunking Strategies",
      "Semantic Caching",
      "BM25 & Lexical Search",
      "Query Rewriting",
    ],
  },
  {
    group: "Agents & Orchestration",
    emoji: "🤖",
    topics: [
      "Agentic Workflows",
      "LangGraph",
      "LangChain",
      "LlamaIndex",
      "Agent Memory Systems",
      "Multi-Agent Systems",
      "ReAct & Planning",
    ],
  },
  {
    group: "Training & Evaluation",
    emoji: "🎯",
    topics: [
      "Fine-Tuning",
      "LoRA / PEFT",
      "Quantization",
      "RLHF",
      "DPO",
      "Model Evaluation",
      "Ragas",
      "LangSmith",
      "Eval Metrics (BLEU/ROUGE)",
      "Distributed Training",
    ],
  },
  {
    group: "ML & DL Fundamentals",
    emoji: "📈",
    topics: [
      "Machine Learning",
      "Deep Learning",
      "PyTorch",
      "TensorFlow",
      "Gradient Descent",
      "Backpropagation",
      "Regularization",
      "Overfitting & Bias-Variance",
      "Cross-Validation",
      "Ensemble Methods",
      "NLP",
      "Recommendation Systems",
    ],
  },
  {
    group: "Programming & DSA",
    emoji: "💻",
    topics: [
      "Python",
      "TypeScript",
      "Data Structures",
      "Algorithms",
      "Time & Space Complexity",
      "Async / Concurrency",
      "Testing",
      "Git",
    ],
  },
  {
    group: "Backend & APIs",
    emoji: "⚙️",
    topics: [
      "API Design",
      "FastAPI",
      "REST vs gRPC",
      "GraphQL",
      "WebSockets",
      "Authentication / JWT",
      "Rate Limiting",
      "Caching (Redis)",
      "Message Queues (Kafka)",
      "Load Balancing",
      "Microservices",
    ],
  },
  {
    group: "Data & Pipelines",
    emoji: "🗄️",
    topics: [
      "SQL",
      "NoSQL vs SQL",
      "Database Indexing",
      "Pandas",
      "Data Wrangling",
      "ETL Pipelines",
      "Batch vs Stream Processing",
      "Apache Spark",
      "Apache Airflow",
      "Data Versioning",
    ],
  },
  {
    group: "MLOps & Infra",
    emoji: "☁️",
    topics: [
      "MLOps",
      "Docker",
      "Kubernetes",
      "Triton Inference Server",
      "vLLM & Model Serving",
      "GPU Optimization",
      "AWS SageMaker",
      "Google Vertex AI",
      "CI/CD",
      "Model Monitoring",
      "Experiment Tracking (MLflow/W&B)",
      "Cost Optimization",
    ],
  },
  {
    group: "Math & Stats",
    emoji: "📐",
    topics: [
      "Linear Algebra",
      "Probability",
      "Statistics",
      "Hypothesis Testing",
    ],
  },
  {
    group: "Systems & Ethics",
    emoji: "🧭",
    topics: [
      "System Design",
      "Systems Thinking",
      "Scalability",
      "AI Ethics",
      "Bias & Fairness",
      "Data Privacy / PII",
    ],
  },
];

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

type Phase = "pick" | "loading" | "run" | "done";

export default function MockView() {
  const { progress, addMockSession } = useProgress();
  const [phase, setPhase] = useState<Phase>("pick");
  const [tab, setTab] = useState<"rounds" | "skills">("rounds");
  const [topicQuery, setTopicQuery] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [type, setType] = useState<InterviewType | null>(null);
  const [set, setSet] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [savedWeak, setSavedWeak] = useState(false);
  // AI answer-grading + voice
  const [userAnswer, setUserAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [gradeErr, setGradeErr] = useState<string | null>(null);
  const [voiceOK, setVoiceOK] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setVoiceOK(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function resetAnswerState() {
    try {
      recRef.current?.stop();
    } catch {}
    setUserAnswer("");
    setGrade(null);
    setGradeErr(null);
    setListening(false);
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        txt += e.results[i][0].transcript;
      if (txt.trim())
        setUserAnswer((prev) => (prev ? prev + " " : "") + txt.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function submitForGrade(q: Question) {
    if (!userAnswer.trim()) return;
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
    setGrading(true);
    setGradeErr(null);
    try {
      const res = await authedFetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          modelAnswer: q.answer,
          userAnswer,
          resume: readResume(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grading failed");
      setGrade(data as GradeResult);
      setRevealed(true);
    } catch (e) {
      setGradeErr(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setGrading(false);
    }
  }

  const start = (t: InterviewType) => {
    const qs = pick(t.cats, 5);
    setType(t);
    setSet(qs);
    setIdx(0);
    setRevealed(false);
    setScores([]);
    setSavedWeak(false);
    resetAnswerState();
    setPhase("run");
  };

  async function startTopic(topic: string) {
    setGenError(null);
    setType({ key: `topic-${topic}`, label: topic, emoji: "🎯", cats: [], desc: topic });
    setPhase("loading");
    try {
      const res = await authedFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 5, resume: readResume() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (!Array.isArray(data.questions) || data.questions.length === 0)
        throw new Error("No questions returned. Try again.");
      setSet(data.questions);
      setIdx(0);
      setRevealed(false);
      setScores([]);
      setSavedWeak(false);
      resetAnswerState();
      setPhase("run");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed");
      setPhase("pick");
    }
  }

  const rate = (score: number) => {
    const next = [...scores, score];
    setScores(next);
    resetAnswerState();
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
          5 questions, self-rate each, get a score.
        </p>

        {genError && (
          <p className="mt-3 text-sm text-[var(--rose-ink)]">{genError}</p>
        )}

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

        {/* segmented control */}
        <div className="mt-5 flex gap-1 p-1 rounded-2xl bg-[var(--surface-muted)]">
          {(["rounds", "skills"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                tab === s
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--ink-soft)]"
              }`}
            >
              {s === "rounds" ? "Interview rounds" : "By skill / topic"}
            </button>
          ))}
        </div>

        {tab === "rounds" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
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
                <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)] mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="var(--ink-faint)" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={topicQuery}
                onChange={(e) => setTopicQuery(e.target.value)}
                placeholder="Search a skill — RAG, PyTorch, SQL…"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-[var(--ink-faint)]"
              />
            </div>
            <p className="text-xs text-[var(--ink-faint)] mb-4">
              Tap a topic — AI generates a 5-question round on it.
            </p>
            {(() => {
              const q = topicQuery.trim().toLowerCase();
              const groups = TOPIC_GROUPS.map((g) => ({
                ...g,
                topics: g.topics.filter((t) => t.toLowerCase().includes(q)),
              })).filter((g) => g.topics.length > 0);
              if (groups.length === 0)
                return (
                  <p className="text-sm text-[var(--ink-soft)] text-center py-6">
                    No topic matches “{topicQuery}”.
                  </p>
                );
              return (
                <div className="flex flex-col gap-5">
                  {groups.map((g) => (
                    <div key={g.group}>
                      <p className="text-xs font-bold text-[var(--ink-soft)] mb-2">
                        {g.emoji} {g.group}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {g.topics.map((t) => (
                          <button
                            key={t}
                            onClick={() => startTopic(t)}
                            className="pill bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)] active:scale-95"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // ---------- LOADING (topic generation) ----------
  if (phase === "loading") {
    return (
      <div className="fade-up flex flex-col items-center justify-center text-center pt-24">
        <div className="h-14 w-14 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin" />
        <h2 className="mt-6 text-xl font-extrabold text-[var(--ink)]">
          Building your round…
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Generating {type?.label} questions
        </p>
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
            {type.emoji} {type.label}
            {type.cats.length > 0 && ` · ${categoryMeta[q.category].label}`}
            {" · "}
            <span className="capitalize">{q.difficulty}</span>
          </p>
          <h2 className="mt-2 text-2xl font-extrabold leading-snug text-[var(--ink)]">
            {q.question}
          </h2>
        </div>

        {grade ? (
          /* ---- AI feedback ---- */
          <div className="mt-6 fade-up">
            <div className="card p-5 text-white bg-[var(--accent)] flex items-center gap-4">
              <div
                className={`h-16 w-16 shrink-0 rounded-full grid place-items-center text-2xl font-extrabold ${
                  grade.score >= 75
                    ? "bg-[#2f8a5b]"
                    : grade.score >= 50
                      ? "bg-[#c08a3a]"
                      : "bg-[#b1607a]"
                }`}
              >
                {grade.score}
              </div>
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase">
                  AI verdict
                </p>
                <p className="font-bold leading-snug">{grade.verdict}</p>
              </div>
            </div>

            {grade.strengths.length > 0 && (
              <div className="mt-3 card-flat p-4">
                <p className="text-xs font-bold text-[#2f8a5b] mb-2">
                  ✓ What worked
                </p>
                <ul className="text-sm text-[var(--ink)] list-disc pl-4 space-y-1">
                  {grade.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {grade.missing.length > 0 && (
              <div className="mt-3 card-flat p-4">
                <p className="text-xs font-bold text-[#c08a3a] mb-2">
                  ⚠ What was missing
                </p>
                <ul className="text-sm text-[var(--ink)] list-disc pl-4 space-y-1">
                  {grade.missing.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {grade.better && (
              <div className="mt-3 card-flat p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--violet-ink)] mb-2">
                  Stronger answer
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                  {grade.better}
                </p>
              </div>
            )}
            <button
              onClick={() => rate(grade.score)}
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] text-white font-semibold py-4 active:scale-[0.98] transition"
            >
              {idx + 1 >= set.length ? "Finish →" : "Next question →"}
            </button>
          </div>
        ) : !revealed ? (
          /* ---- answer input (type or speak) ---- */
          <div className="mt-6 fade-up">
            <div className="card p-4">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                placeholder="Type your answer — or tap the mic and speak it like a real interview."
                className="w-full bg-[var(--surface-muted)] rounded-2xl px-4 py-3 text-sm outline-none resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
              />
              {voiceOK && (
                <button
                  onClick={toggleVoice}
                  className={`mt-3 w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 ${
                    listening
                      ? "bg-[#fbe6ec] text-[#b1607a]"
                      : "bg-[var(--surface-muted)] text-[var(--ink)]"
                  }`}
                >
                  <span className={listening ? "animate-pulse" : ""}>🎙️</span>
                  {listening ? "Listening… tap to stop" : "Speak your answer"}
                </button>
              )}
            </div>

            {gradeErr && (
              <p className="mt-3 text-sm text-[var(--rose-ink)]">{gradeErr}</p>
            )}

            <button
              onClick={() => submitForGrade(q)}
              disabled={!userAnswer.trim() || grading}
              className="mt-4 w-full rounded-2xl bg-[var(--violet)] text-white font-semibold py-4 disabled:opacity-50 active:scale-[0.98] transition"
            >
              {grading ? "Grading your answer…" : "Get AI feedback"}
            </button>
            <button
              onClick={() => setRevealed(true)}
              className="mt-2 w-full rounded-2xl text-[var(--ink-soft)] font-semibold py-3 active:scale-[0.98] transition"
            >
              Skip — show answer &amp; self-rate
            </button>
          </div>
        ) : (
          /* ---- model answer + self-rate ---- */
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
      <div className="h-28 w-28 rounded-full bg-[var(--accent)] text-white grid place-items-center shadow-[var(--shadow)]">
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

      {/* weak-topic revision suggestion */}
      {(() => {
        const weak = set.filter((_, i) => scores[i] < 75);
        if (weak.length === 0)
          return (
            <div className="mt-4 w-full card-flat p-4 text-center">
              <p className="text-sm font-semibold text-[var(--ink)]">
                🎉 No weak spots this round — nice work!
              </p>
            </div>
          );
        return (
          <div className="mt-4 w-full card p-5 text-white bg-[var(--violet)] text-left">
            <p className="font-bold text-lg">Revise these {weak.length}</p>
            <p className="text-white/80 text-sm mt-1">
              You rated {weak.length} answer{weak.length > 1 ? "s" : ""} below
              Strong. Save them to your revision notes and review before the
              interview.
            </p>
            <button
              onClick={() => {
                weak.forEach((q) =>
                  addSaved({
                    type: "qa",
                    title: q.question,
                    content: q.answer,
                    tags: [type?.label ?? "mock", "revise"],
                  })
                );
                setSavedWeak(true);
              }}
              disabled={savedWeak}
              className="mt-4 w-full rounded-2xl bg-white text-[var(--violet-ink)] font-semibold py-3.5 disabled:opacity-70 active:scale-[0.98] transition"
            >
              {savedWeak ? "✓ Saved to revision" : "🔖 Save weak answers to revision"}
            </button>
          </div>
        );
      })()}

      <div className="mt-5 w-full flex flex-col gap-3">
        <button
          onClick={() =>
            type &&
            (type.cats.length === 0 ? startTopic(type.label) : start(type))
          }
          className="w-full rounded-2xl bg-[var(--accent)] text-white font-semibold py-4 active:scale-[0.98] transition"
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
