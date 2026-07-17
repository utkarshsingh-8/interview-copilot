"use client";

// Active resume store. localStorage is the source of truth so editing works
// instantly with no login. If Supabase is configured AND the user is signed in,
// the resume is also mirrored to the `resumes` table for cross-device sync.

import { useCallback, useEffect, useState } from "react";
import { resume as defaultResume, type Resume } from "./resume";
import { getSupabase } from "./supabase";

const KEY = "copilot.resume.v1";

export function readResume(): Resume {
  if (typeof window === "undefined") return defaultResume;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultResume;
    return { ...defaultResume, ...JSON.parse(raw) } as Resume;
  } catch {
    return defaultResume;
  }
}

function writeLocal(r: Resume) {
  localStorage.setItem(KEY, JSON.stringify(r));
  window.dispatchEvent(new Event("copilot:resume"));
}

async function syncToCloud(r: Resume) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return; // needs login for RLS
    await sb.from("resumes").upsert({
      user_id: uid,
      data: r,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // best-effort; localStorage already holds the truth
  }
}

// Reconcile: if the cloud has a resume, adopt it locally; if not but we have a
// local one, push it up. Returns the resume to show (or null if unchanged).
async function reconcileCloud(): Promise<Resume | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return null;
    const { data } = await sb
      .from("resumes")
      .select("data")
      .eq("user_id", uid)
      .maybeSingle();
    if (data?.data) {
      const cloud = data.data as Resume;
      localStorage.setItem(KEY, JSON.stringify(cloud));
      return { ...defaultResume, ...cloud };
    }
    // nothing in cloud yet — seed it from local
    await syncToCloud(readResume());
    return null;
  } catch {
    return null;
  }
}

export function useResume() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setResume(readResume());
    setReady(true);
    const pull = () =>
      reconcileCloud().then((cloud) => {
        if (cloud) setResume(cloud);
      });
    pull();
    const onChange = () => setResume(readResume());
    window.addEventListener("copilot:resume", onChange);
    window.addEventListener("copilot:auth", pull);
    return () => {
      window.removeEventListener("copilot:resume", onChange);
      window.removeEventListener("copilot:auth", pull);
    };
  }, []);

  const save = useCallback((r: Resume) => {
    writeLocal(r);
    void syncToCloud(r);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("copilot:resume"));
  }, []);

  return { resume, ready, save, reset };
}
