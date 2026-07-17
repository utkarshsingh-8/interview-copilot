"use client";

// Store for AI-generated question banks (the "Regenerate bank" output).
// localStorage-backed, mirrored to Supabase `saved_questions` when signed in.

import { useCallback, useEffect, useState } from "react";
import type { Question } from "./questions";
import { getSupabase } from "./supabase";

const KEY = "copilot.savedq.v1";

export function readSaved(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Question[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(qs: Question[]) {
  localStorage.setItem(KEY, JSON.stringify(qs));
  window.dispatchEvent(new Event("copilot:savedq"));
}

async function syncToCloud(qs: Question[]) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    // replace this user's saved set
    await sb.from("saved_questions").delete().eq("user_id", uid);
    if (qs.length) {
      await sb.from("saved_questions").insert(
        qs.map((q) => ({
          user_id: uid,
          category: q.category,
          difficulty: q.difficulty,
          question: q.question,
          answer: q.answer,
          tags: q.tags,
        }))
      );
    }
  } catch {
    // best-effort
  }
}

export function useSavedQuestions() {
  const [saved, setSaved] = useState<Question[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(readSaved());
    setReady(true);
    const onChange = () => setSaved(readSaved());
    window.addEventListener("copilot:savedq", onChange);
    return () => window.removeEventListener("copilot:savedq", onChange);
  }, []);

  const replaceAll = useCallback((qs: Question[]) => {
    writeLocal(qs);
    void syncToCloud(qs);
  }, []);

  const clear = useCallback(() => {
    writeLocal([]);
    void syncToCloud([]);
  }, []);

  return { saved, ready, replaceAll, clear };
}
