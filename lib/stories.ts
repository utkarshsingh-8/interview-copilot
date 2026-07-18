"use client";

// STAR behavioral story bank. localStorage source of truth, mirrored to
// Supabase `stories` when signed in.

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type Story = {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  updatedAt: string;
};

const KEY = "copilot.stories.v1";

export const STARTER_PROMPTS = [
  "A time you improved a system's performance",
  "A hard technical trade-off you made",
  "A conflict with a teammate",
  "A project that failed / a mistake you made",
  "Leading without authority",
  "Handling ambiguity with no clear spec",
  "Meeting a tight deadline under pressure",
];

function read(): Story[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLocal(items: Story[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("copilot:stories"));
}
function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Date.now()}-${Math.round(performance.now())}`;
  }
}

async function cloudUpsert(s: Story) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await sb.from("stories").upsert({
      id: s.id,
      user_id: uid,
      title: s.title,
      situation: s.situation,
      task: s.task,
      action: s.action,
      result: s.result,
      tags: s.tags,
      updated_at: s.updatedAt,
    });
  } catch {
    /* best-effort */
  }
}
async function cloudDelete(id: string) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    if (!data.user?.id) return;
    await sb.from("stories").delete().eq("id", id);
  } catch {
    /* best-effort */
  }
}
async function reconcileCloud(): Promise<Story[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return null;
    const { data } = await sb
      .from("stories")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (data && data.length) {
      const items: Story[] = data.map((r) => ({
        id: String(r.id),
        title: r.title,
        situation: r.situation ?? "",
        task: r.task ?? "",
        action: r.action ?? "",
        result: r.result ?? "",
        tags: r.tags ?? [],
        updatedAt: r.updated_at,
      }));
      localStorage.setItem(KEY, JSON.stringify(items));
      return items;
    }
    for (const s of read()) await cloudUpsert(s);
    return null;
  } catch {
    return null;
  }
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStories(read());
    setReady(true);
    const pull = () =>
      reconcileCloud().then((items) => {
        if (items) setStories(items);
      });
    pull();
    const onChange = () => setStories(read());
    window.addEventListener("copilot:stories", onChange);
    window.addEventListener("copilot:auth", pull);
    return () => {
      window.removeEventListener("copilot:stories", onChange);
      window.removeEventListener("copilot:auth", pull);
    };
  }, []);

  const save = useCallback((s: Story) => {
    const items = read();
    const idx = items.findIndex((x) => x.id === s.id);
    const next = { ...s, updatedAt: new Date().toISOString() };
    if (idx >= 0) items[idx] = next;
    else items.unshift(next);
    writeLocal(items);
    void cloudUpsert(next);
  }, []);

  const remove = useCallback((id: string) => {
    writeLocal(read().filter((s) => s.id !== id));
    void cloudDelete(id);
  }, []);

  const create = useCallback(
    (title = ""): Story => ({
      id: newId(),
      title,
      situation: "",
      task: "",
      action: "",
      result: "",
      tags: [],
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  return { stories, ready, save, remove, create };
}
