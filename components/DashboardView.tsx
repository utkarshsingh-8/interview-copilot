"use client";

import Link from "next/link";
import { useMemo } from "react";
import Avatar3D from "@/components/Avatar3D";
import { useResume } from "@/lib/resumeStore";
import {
  categoryMeta,
  questions,
  type Category,
} from "@/lib/questions";
import { useProgress } from "@/lib/progress";

const confWeight = { low: 0.34, medium: 0.67, high: 1 } as const;
const categories = Object.keys(categoryMeta) as Category[];

export default function DashboardView() {
  const { progress, ready } = useProgress();
  const { resume } = useResume();

  const stats = useMemo(() => {
    const total = questions.length;
    const practicedIds = Object.keys(progress.practiced);
    const practicedCount = practicedIds.length;

    // readiness = coverage * confidence, nudged by mock scores
    let confSum = 0;
    for (const id of practicedIds) {
      confSum += confWeight[progress.practiced[id]] ?? 0;
    }
    const coverageScore = (confSum / total) * 100; // 0..100

    const mockAvg =
      progress.mockSessions.length > 0
        ? progress.mockSessions.reduce((s, m) => s + m.score, 0) /
          progress.mockSessions.length
        : null;

    const readiness = Math.round(
      mockAvg == null
        ? coverageScore
        : coverageScore * 0.7 + mockAvg * 0.3
    );

    // per-category strength
    const perCat = categories.map((c) => {
      const inCat = questions.filter((q) => q.category === c);
      const done = inCat.filter((q) => progress.practiced[q.id]);
      const conf =
        done.reduce((s, q) => s + confWeight[progress.practiced[q.id]], 0) /
        Math.max(inCat.length, 1);
      return { c, pct: Math.round(conf * 100), total: inCat.length, done: done.length };
    });

    const strengths = [...perCat].sort((a, b) => b.pct - a.pct).slice(0, 3);
    const weak = [...perCat].sort((a, b) => a.pct - b.pct).slice(0, 3);

    // today's tasks: unpracticed questions, hardest first
    const order = { staff: 0, advanced: 1, intermediate: 2, beginner: 3 };
    const todo = questions
      .filter((q) => !progress.practiced[q.id])
      .sort((a, b) => order[a.difficulty] - order[b.difficulty])
      .slice(0, 3);

    return {
      total,
      practicedCount,
      readiness: Math.min(readiness, 100),
      mockCount: progress.mockSessions.length,
      strengths,
      weak,
      todo,
    };
  }, [progress]);

  const verdict =
    stats.readiness >= 75
      ? "Interview ready"
      : stats.readiness >= 45
        ? "Getting there"
        : "Warming up";

  return (
    <div className="fade-up">
      {/* greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--ink-soft)]">Hello, Utkarsh 👋</p>
          <h1 className="text-[1.9rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
            Let&apos;s get you
            <br />
            interview ready
          </h1>
        </div>
        <Link
          href="/profile"
          className="rounded-full shadow-[var(--shadow-sm)] shrink-0 active:scale-95 transition"
          aria-label="Profile"
        >
          <Avatar3D size={52} />
        </Link>
      </div>

      {/* readiness card */}
      <div className="mt-6 card p-6 text-white bg-[var(--ink)] relative overflow-hidden">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[var(--violet)] opacity-40 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <Ring value={ready ? stats.readiness : 0} />
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Readiness
            </p>
            <p className="text-2xl font-extrabold">{verdict}</p>
            <p className="text-white/70 text-sm mt-1">
              {stats.practicedCount}/{stats.total} answers practiced
            </p>
          </div>
        </div>
      </div>

      {/* quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          label="Questions practiced"
          value={`${stats.practicedCount}`}
          sub={`of ${stats.total}`}
        />
        <StatCard
          label="Mock interviews"
          value={`${stats.mockCount}`}
          sub="completed"
          rose
        />
      </div>

      {/* activity CTA */}
      <Link
        href="/activity"
        className="mt-4 card-flat p-4 flex items-center gap-3 active:scale-[0.99] transition"
      >
        <span className="text-2xl">📅</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-[var(--ink)]">
            Activity &amp; reports
          </p>
          <p className="text-xs text-[var(--ink-faint)]">
            Calendar, streak, daily &amp; weekly analytics
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="m9 6 6 6-6 6"
            stroke="#9a95ac"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      {/* target a job CTA */}
      <Link
        href="/jd"
        className="mt-4 card p-5 flex items-center gap-4 bg-[var(--violet)] text-white active:scale-[0.99] transition"
      >
        <span className="text-3xl">🎯</span>
        <div className="flex-1">
          <p className="font-bold text-[15px]">Prep for a specific job</p>
          <p className="text-white/80 text-xs">
            Paste a JD → match score, gaps &amp; likely questions
          </p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="m9 6 6 6-6 6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      {/* strengths */}
      <SectionHeader title="Strongest topics" />
      <div className="flex flex-wrap gap-2">
        {stats.strengths.map((s) => (
          <span
            key={s.c}
            className="pill bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
          >
            {categoryMeta[s.c].emoji} {categoryMeta[s.c].label}
            <span className="text-[var(--violet-ink)] font-bold">{s.pct}%</span>
          </span>
        ))}
      </div>

      {/* weak areas */}
      <SectionHeader title="Needs revision" />
      <div className="flex flex-col gap-2">
        {stats.weak.map((s) => (
          <div
            key={s.c}
            className="card-flat px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{categoryMeta[s.c].emoji}</span>
              <span className="font-semibold text-sm text-[var(--ink)]">
                {categoryMeta[s.c].label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-20 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--violet)]"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--ink-soft)] w-9 text-right">
                {s.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* today's tasks */}
      <div className="flex items-center justify-between mt-7 mb-3">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">
          Practice today
        </h2>
        <Link
          href="/questions"
          className="text-sm font-semibold text-[var(--violet-ink)]"
        >
          See all
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {stats.todo.length === 0 ? (
          <div className="card-flat p-5 text-center text-sm text-[var(--ink-soft)]">
            🎉 You&apos;ve practiced every question. Try a mock interview.
          </div>
        ) : (
          stats.todo.map((q) => (
            <Link
              key={q.id}
              href="/questions"
              className="card-flat p-4 flex items-center gap-3 active:scale-[0.99] transition"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--violet-soft)] grid place-items-center">
                {categoryMeta[q.category].emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink)] truncate">
                  {q.question}
                </p>
                <p className="text-xs text-[var(--ink-faint)] capitalize">
                  {q.difficulty} · {categoryMeta[q.category].label}
                </p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 6 6 6-6 6"
                  stroke="#9a95ac"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))
        )}
      </div>

      {/* resume skills */}
      <SectionHeader title="Your resume skills" />
      <div className="flex flex-wrap gap-2 pb-2">
        {[...resume.skills.genai, ...resume.skills.llms.slice(0, 4)].map((s) => (
          <span
            key={s}
            className="pill bg-[var(--surface)] text-[var(--ink-soft)] shadow-[var(--shadow-sm)] !text-xs"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="#8b7ce8"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-extrabold">{value}</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  rose,
}: {
  label: string;
  value: string;
  sub: string;
  rose?: boolean;
}) {
  return (
    <div
      className={`card-flat p-4 ${rose ? "bg-[var(--rose)]" : ""}`}
      style={rose ? { background: "var(--rose)" } : undefined}
    >
      <p className="text-3xl font-extrabold text-[var(--ink)]">{value}</p>
      <p className="text-xs font-semibold text-[var(--ink-soft)] mt-1">
        {label}
      </p>
      <p className="text-[11px] text-[var(--ink-faint)]">{sub}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-extrabold text-[var(--ink)] mt-7 mb-3">
      {title}
    </h2>
  );
}
