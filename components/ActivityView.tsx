"use client";

import { useMemo, useState } from "react";
import {
  activityMeta,
  countsByType,
  dayKey,
  eventsOn,
  lastNDays,
  streak,
  useActivity,
  type ActivityEvent,
  type ActivityType,
} from "@/lib/activity";

const types = Object.keys(activityMeta) as ActivityType[];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ActivityView() {
  const { events } = useActivity();
  const [seg, setSeg] = useState<"today" | "week" | "calendar">("today");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selDay, setSelDay] = useState<string | null>(null);

  const todayKey = dayKey(new Date());
  const todayEvents = useMemo(
    () => eventsOn(events, todayKey),
    [events, todayKey]
  );
  const week = useMemo(() => lastNDays(events, 7), [events]);
  const st = useMemo(() => streak(events), [events]);

  return (
    <div className="fade-up">
      <p className="text-sm font-semibold text-[var(--violet-ink)]">Reports</p>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
        Your activity
      </h1>

      {/* streak banner */}
      <div className="mt-4 card p-4 text-white bg-[var(--ink)] flex items-center gap-3">
        <span className="text-3xl">🔥</span>
        <div>
          <p className="text-2xl font-extrabold leading-none">
            {st} day{st === 1 ? "" : "s"}
          </p>
          <p className="text-white/70 text-xs font-semibold">
            {st === 0 ? "Start your streak today" : "Current streak"}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-extrabold leading-none">
            {events.length}
          </p>
          <p className="text-white/70 text-xs font-semibold">Total actions</p>
        </div>
      </div>

      {/* segments */}
      <div className="mt-4 flex gap-1 p-1 rounded-2xl bg-[var(--surface-muted)]">
        {(["today", "week", "calendar"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeg(s)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              seg === s
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-soft)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {seg === "today" && (
        <DayReport title="Today" events={todayEvents} empty="Nothing yet today — practice a question or run a mock." />
      )}

      {seg === "week" && (
        <div className="mt-5 fade-up">
          <WeekChart week={week} />
          <h2 className="text-sm font-extrabold text-[var(--ink)] mt-6 mb-2">
            This week
          </h2>
          <TypeGrid events={week.flatMap((d) => eventsOn(events, d.key))} />
          <WeekSummary events={week.flatMap((d) => eventsOn(events, d.key))} week={week} />
        </div>
      )}

      {seg === "calendar" && (
        <div className="mt-5 fade-up">
          <Calendar
            events={events}
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
            selDay={selDay}
            setSelDay={setSelDay}
          />
          {selDay && (
            <DayReport
              title={new Date(selDay + "T00:00:00").toLocaleDateString(
                undefined,
                { weekday: "long", day: "numeric", month: "long" }
              )}
              events={eventsOn(events, selDay)}
              empty="No activity on this day."
            />
          )}
        </div>
      )}
    </div>
  );
}

function TypeGrid({ events }: { events: ActivityEvent[] }) {
  const c = countsByType(events);
  return (
    <div className="grid grid-cols-5 gap-2">
      {types.map((t) => (
        <div key={t} className="card-flat p-2 text-center">
          <p className="text-lg">{activityMeta[t].emoji}</p>
          <p className="text-xl font-extrabold text-[var(--ink)] leading-none">
            {c[t]}
          </p>
          <p className="text-[9px] font-semibold text-[var(--ink-faint)] mt-1">
            {activityMeta[t].label}
          </p>
        </div>
      ))}
    </div>
  );
}

function DayReport({
  title,
  events,
  empty,
}: {
  title: string;
  events: ActivityEvent[];
  empty: string;
}) {
  return (
    <div className="mt-5 fade-up">
      <h2 className="text-sm font-extrabold text-[var(--ink)] mb-2">{title}</h2>
      <TypeGrid events={events} />
      <div className="mt-4 flex flex-col gap-2">
        {events.map((e) => (
          <div key={e.id} className="card-flat px-4 py-3 flex items-center gap-3">
            <span
              className={`pill !py-1 !px-2 !text-[10px] ${activityMeta[e.type].color}`}
            >
              {activityMeta[e.type].emoji}
            </span>
            <p className="flex-1 min-w-0 text-sm text-[var(--ink)] truncate">
              {e.label}
            </p>
            {e.score != null && (
              <span
                className={`text-xs font-bold ${
                  e.score >= 75
                    ? "text-[#2f8a5b]"
                    : e.score >= 50
                      ? "text-[#c08a3a]"
                      : "text-[#b1607a]"
                }`}
              >
                {e.score}%
              </span>
            )}
            <span className="text-[10px] text-[var(--ink-faint)]">
              {new Date(e.at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="card-flat p-6 text-center text-sm text-[var(--ink-soft)]">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekChart({
  week,
}: {
  week: { key: string; date: Date; count: number; mockAvg: number | null }[];
}) {
  const max = Math.max(1, ...week.map((d) => d.count));
  return (
    <div className="card-flat p-4">
      <p className="text-xs font-semibold text-[var(--ink-soft)] mb-3">
        Last 7 days
      </p>
      <div className="flex items-end justify-between gap-2 h-28">
        {week.map((d) => (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-[var(--ink-faint)]">
              {d.count || ""}
            </span>
            <div
              className="w-full rounded-lg bg-[var(--violet)] transition-all"
              style={{
                height: `${Math.max((d.count / max) * 80, d.count ? 8 : 3)}px`,
                opacity: d.count ? 1 : 0.18,
              }}
            />
            <span className="text-[10px] font-semibold text-[var(--ink-faint)]">
              {WEEKDAYS[d.date.getDay()]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekSummary({
  events,
  week,
}: {
  events: ActivityEvent[];
  week: { count: number; mockAvg: number | null }[];
}) {
  const mocks = events.filter((e) => e.type === "mock" && e.score != null);
  const avg = mocks.length
    ? Math.round(mocks.reduce((s, m) => s + (m.score ?? 0), 0) / mocks.length)
    : null;
  const activeDays = week.filter((d) => d.count > 0).length;
  const total = week.reduce((s, d) => s + d.count, 0);

  return (
    <div className="mt-4 card-flat p-4">
      <Row label="Total actions" value={`${total}`} />
      <Row label="Active days" value={`${activeDays}/7`} />
      <Row label="Mock rounds" value={`${mocks.length}`} />
      <Row
        label="Avg mock score"
        value={avg == null ? "—" : `${avg}%`}
        last
      />
      <p className="mt-3 text-xs text-[var(--ink-soft)] leading-relaxed">
        {total === 0
          ? "No activity this week. Even one mock round moves your readiness."
          : activeDays >= 5
            ? "Strong consistency — this is exactly how you stay interview-ready."
            : "Try to touch the app on more days — short daily reps beat long gaps."}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        last ? "" : "border-b border-[var(--line)]"
      }`}
    >
      <span className="text-sm text-[var(--ink-soft)]">{label}</span>
      <span className="text-sm font-bold text-[var(--ink)]">{value}</span>
    </div>
  );
}

function Calendar({
  events,
  monthOffset,
  setMonthOffset,
  selDay,
  setSelDay,
}: {
  events: ActivityEvent[];
  monthOffset: number;
  setMonthOffset: (n: number) => void;
  selDay: string | null;
  setSelDay: (k: string | null) => void;
}) {
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const todayKey = dayKey(new Date());

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const k = dayKey(e.at);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shade = (n: number) =>
    n === 0
      ? "bg-[var(--surface-muted)] text-[var(--ink-faint)]"
      : n <= 2
        ? "bg-[#ddd5f7] text-[var(--ink)]"
        : n <= 5
          ? "bg-[#b3a6f0] text-white"
          : "bg-[var(--violet)] text-white";

  return (
    <div className="card-flat p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthOffset(monthOffset - 1)}
          className="h-8 w-8 rounded-full bg-[var(--surface-muted)] grid place-items-center text-[var(--ink-soft)]"
        >
          ‹
        </button>
        <p className="text-sm font-extrabold text-[var(--ink)]">
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          onClick={() => setMonthOffset(Math.min(monthOffset + 1, 0))}
          disabled={monthOffset >= 0}
          className="h-8 w-8 rounded-full bg-[var(--surface-muted)] grid place-items-center text-[var(--ink-soft)] disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold text-[var(--ink-faint)]"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const key = dayKey(new Date(year, m, d));
          const n = counts.get(key) ?? 0;
          const isToday = key === todayKey;
          const isSel = key === selDay;
          return (
            <button
              key={key}
              onClick={() => setSelDay(isSel ? null : key)}
              className={`aspect-square rounded-lg text-xs font-bold grid place-items-center transition active:scale-90 ${shade(
                n
              )} ${isSel ? "ring-2 ring-[var(--ink)]" : ""} ${
                isToday && !isSel ? "ring-2 ring-[var(--violet-ink)]" : ""
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-[var(--ink-faint)]">Less</span>
        {[0, 1, 3, 6].map((n) => (
          <span key={n} className={`h-3 w-3 rounded ${shade(n)}`} />
        ))}
        <span className="text-[10px] text-[var(--ink-faint)]">More</span>
      </div>
    </div>
  );
}
