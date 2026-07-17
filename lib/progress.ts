"use client";

// Lightweight local progress store (localStorage). Tracks what you've
// practiced and how confident you feel, so the Dashboard can compute a
// readiness score without a backend. Later this can sync to Supabase.

import { useCallback, useEffect, useState } from "react";
import { logActivity } from "./activity";

const KEY = "copilot.progress.v1";

export type Confidence = "low" | "medium" | "high";

export type Progress = {
  practiced: Record<string, Confidence>; // questionId -> confidence
  mockSessions: {
    id: string;
    type: string;
    score: number;
    date: string;
  }[];
  lastActive: string | null;
  streak: number;
};

const empty: Progress = {
  practiced: {},
  mockSessions: [],
  lastActive: null,
  streak: 0,
};

function read(): Progress {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

function write(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("copilot:progress"));
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(read());
    setReady(true);
    const onChange = () => setProgress(read());
    window.addEventListener("copilot:progress", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("copilot:progress", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const markPracticed = useCallback(
    (id: string, confidence: Confidence, label?: string) => {
      const p = read();
      const isNew = !p.practiced[id];
      p.practiced[id] = confidence;
      p.lastActive = new Date().toISOString();
      write(p);
      if (isNew) logActivity("practice", label || id);
    },
    []
  );

  const unmarkPracticed = useCallback((id: string) => {
    const p = read();
    delete p.practiced[id];
    write(p);
  }, []);

  const addMockSession = useCallback(
    (s: { type: string; score: number }) => {
      const p = read();
      p.mockSessions.unshift({
        id: `${p.mockSessions.length + 1}-${s.type}`,
        type: s.type,
        score: s.score,
        date: new Date().toISOString(),
      });
      p.lastActive = new Date().toISOString();
      write(p);
      logActivity("mock", s.type, s.score);
    },
    []
  );

  return {
    progress,
    ready,
    markPracticed,
    unmarkPracticed,
    addMockSession,
  };
}
