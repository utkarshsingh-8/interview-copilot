"use client";

// Activity log — every meaningful action (mock finished, question practiced,
// concept searched, answer saved, JD analyzed) so the Activity tab can show a
// calendar and daily/weekly reports. localStorage source of truth; mirrored to
// Supabase `activity` when signed in.

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type ActivityType = "mock" | "practice" | "learn" | "save" | "jd";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  label: string;
  score: number | null;
  at: string; // ISO
};

export const activityMeta: Record<
  ActivityType,
  { label: string; emoji: string; color: string }
> = {
  mock: { label: "Mock round", emoji: "🎤", color: "bg-[#f3e9fb] text-[#8a4fc0]" },
  practice: { label: "Practiced", emoji: "💬", color: "bg-[#e7eefb] text-[#3a6bd0]" },
  learn: { label: "Learned", emoji: "📚", color: "bg-[#e2f3ea] text-[#2f8a5b]" },
  save: { label: "Saved", emoji: "🔖", color: "bg-[#fdf1e3] text-[#c08a3a]" },
  jd: { label: "JD analyzed", emoji: "🎯", color: "bg-[#fbe6ec] text-[#b1607a]" },
};

const KEY = "copilot.activity.v1";
const MAX = 2000; // keep the log bounded

export function dayKey(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  // local YYYY-MM-DD
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function readActivity(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: ActivityEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event("copilot:activity"));
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `e-${Date.now()}-${Math.round(performance.now())}`;
  }
}

async function cloudInsert(e: ActivityEvent) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await sb.from("activity").insert({
      id: e.id,
      user_id: uid,
      type: e.type,
      label: e.label,
      score: e.score,
      created_at: e.at,
    });
  } catch {
    /* best-effort */
  }
}

// Fire-and-forget logger, callable from anywhere on the client.
export function logActivity(
  type: ActivityType,
  label: string,
  score?: number
): void {
  if (typeof window === "undefined") return;
  const e: ActivityEvent = {
    id: newId(),
    type,
    label: (label || "").slice(0, 200),
    score: typeof score === "number" ? score : null,
    at: new Date().toISOString(),
  };
  writeLocal([e, ...readActivity()]);
  void cloudInsert(e);
}

async function reconcileCloud(): Promise<ActivityEvent[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return null;
    const { data } = await sb
      .from("activity")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(MAX);
    if (data && data.length) {
      const items: ActivityEvent[] = data.map((r) => ({
        id: String(r.id),
        type: r.type,
        label: r.label,
        score: r.score,
        at: r.created_at,
      }));
      localStorage.setItem(KEY, JSON.stringify(items));
      return items;
    }
    for (const e of readActivity()) await cloudInsert(e);
    return null;
  } catch {
    return null;
  }
}

export function useActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEvents(readActivity());
    setReady(true);
    const pull = () =>
      reconcileCloud().then((items) => {
        if (items) setEvents(items);
      });
    pull();
    const onChange = () => setEvents(readActivity());
    window.addEventListener("copilot:activity", onChange);
    window.addEventListener("copilot:auth", pull);
    return () => {
      window.removeEventListener("copilot:activity", onChange);
      window.removeEventListener("copilot:auth", pull);
    };
  }, []);

  const clear = useCallback(() => writeLocal([]), []);

  return { events, ready, clear };
}

// ---- aggregation helpers ----

export function countsByType(events: ActivityEvent[]) {
  const c: Record<ActivityType, number> = {
    mock: 0,
    practice: 0,
    learn: 0,
    save: 0,
    jd: 0,
  };
  for (const e of events) c[e.type] = (c[e.type] ?? 0) + 1;
  return c;
}

export function eventsOn(events: ActivityEvent[], key: string) {
  return events.filter((e) => dayKey(e.at) === key);
}

// last N days (oldest → newest) with counts
export function lastNDays(events: ActivityEvent[], n: number) {
  const out: { key: string; date: Date; count: number; mockAvg: number | null }[] =
    [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    const evts = eventsOn(events, key);
    const mocks = evts.filter((e) => e.type === "mock" && e.score != null);
    out.push({
      key,
      date: d,
      count: evts.length,
      mockAvg: mocks.length
        ? Math.round(mocks.reduce((s, m) => s + (m.score ?? 0), 0) / mocks.length)
        : null,
    });
  }
  return out;
}

export function streak(events: ActivityEvent[]): number {
  const days = new Set(events.map((e) => dayKey(e.at)));
  let s = 0;
  const d = new Date();
  // allow today to be empty and still count a streak ending yesterday
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
}
