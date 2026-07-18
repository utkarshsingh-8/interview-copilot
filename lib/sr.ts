"use client";

// Spaced-repetition scheduler (SM-2 lite). Kept in its own localStorage key,
// separate from notes, so cloud sync of notes never wipes review state.
// Schedules are per note id and inherently device/time-local.

import { useCallback, useEffect, useState } from "react";

export type SRGrade = "again" | "hard" | "good" | "easy";

type Sched = { due: string; interval: number; ease: number; reps: number };

const KEY = "copilot.sr.v1";
const DAY = 86400000;

function read(): Record<string, Sched> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function write(map: Record<string, Sched>) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("copilot:sr"));
}

// A note is "due" if it has no schedule yet (new) or its due date has passed.
export function isDue(id: string, map = read()): boolean {
  const s = map[id];
  if (!s) return true;
  return new Date(s.due).getTime() <= Date.now();
}

export function dueCount(ids: string[]): number {
  const map = read();
  return ids.filter((id) => isDue(id, map)).length;
}

export function review(id: string, grade: SRGrade) {
  const map = read();
  const prev = map[id] || { due: new Date().toISOString(), interval: 0, ease: 2.3, reps: 0 };
  let { interval, ease, reps } = prev;
  let dueMs = Date.now();

  switch (grade) {
    case "again":
      ease = Math.max(1.3, ease - 0.2);
      interval = 0;
      reps = 0;
      dueMs += 10 * 60 * 1000; // 10 minutes
      break;
    case "hard":
      ease = Math.max(1.3, ease - 0.15);
      interval = Math.max(1, Math.round(interval * 1.2 || 1));
      reps += 1;
      dueMs += interval * DAY;
      break;
    case "good":
      interval = reps === 0 ? 1 : Math.round(interval * ease) || 1;
      reps += 1;
      dueMs += interval * DAY;
      break;
    case "easy":
      ease = Math.min(2.8, ease + 0.15);
      interval = reps === 0 ? 2 : Math.round(interval * ease * 1.3) || 2;
      reps += 1;
      dueMs += interval * DAY;
      break;
  }

  map[id] = { due: new Date(dueMs).toISOString(), interval, ease, reps };
  write(map);
}

export function useSR() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("copilot:sr", on);
    return () => window.removeEventListener("copilot:sr", on);
  }, []);
  const due = useCallback((ids: string[]) => dueCount(ids), [tick]);
  const dueList = useCallback(
    (ids: string[]) => {
      const map = read();
      return ids.filter((id) => isDue(id, map));
    },
    [tick]
  );
  return { due, dueList, review, tick };
}
