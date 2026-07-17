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

async function loadFromCloud(): Promise<Resume | null> {
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
    return (data?.data as Resume) ?? null;
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
    // if signed in, prefer cloud copy
    loadFromCloud().then((cloud) => {
      if (cloud) {
        localStorage.setItem(KEY, JSON.stringify(cloud));
        setResume({ ...defaultResume, ...cloud });
      }
    });
    const onChange = () => setResume(readResume());
    window.addEventListener("copilot:resume", onChange);
    return () => window.removeEventListener("copilot:resume", onChange);
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
