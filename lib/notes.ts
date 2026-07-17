"use client";

// Saved answers & notes — your personal revision material. Save an AI answer
// from Learn, a model answer from Q&A, or write your own note. localStorage is
// the source of truth; mirrored to Supabase `notes` when signed in.

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type SavedType = "learn" | "qa" | "note";

export type SavedItem = {
  id: string;
  type: SavedType;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
};

const KEY = "copilot.notes.v1";

export function readNotes(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: SavedItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("copilot:notes"));
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `n-${Date.now()}-${Math.round(performance.now())}`;
  }
}

async function cloudInsert(item: SavedItem) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await sb.from("notes").insert({
      id: item.id,
      user_id: uid,
      type: item.type,
      title: item.title,
      content: item.content,
      tags: item.tags,
      created_at: item.createdAt,
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
    await sb.from("notes").delete().eq("id", id);
  } catch {
    /* best-effort */
  }
}

// Standalone save — usable from anywhere (Learn, Q&A) without the hook.
export function addSaved(input: {
  type: SavedType;
  title: string;
  content: string;
  tags?: string[];
}): SavedItem {
  const item: SavedItem = {
    id: newId(),
    type: input.type,
    title: input.title.slice(0, 300),
    content: input.content,
    tags: input.tags ?? [],
    createdAt: new Date().toISOString(),
  };
  const items = readNotes();
  writeLocal([item, ...items]);
  void cloudInsert(item);
  return item;
}

async function reconcileCloud(): Promise<SavedItem[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return null;
    const { data } = await sb
      .from("notes")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data && data.length) {
      const items: SavedItem[] = data.map((r) => ({
        id: String(r.id),
        type: r.type,
        title: r.title,
        content: r.content,
        tags: r.tags ?? [],
        createdAt: r.created_at,
      }));
      localStorage.setItem(KEY, JSON.stringify(items));
      return items;
    }
    // seed cloud from local
    const local = readNotes();
    for (const it of local) await cloudInsert(it);
    return null;
  } catch {
    return null;
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<SavedItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNotes(readNotes());
    setReady(true);
    const pull = () =>
      reconcileCloud().then((items) => {
        if (items) setNotes(items);
      });
    pull();
    const onChange = () => setNotes(readNotes());
    window.addEventListener("copilot:notes", onChange);
    window.addEventListener("copilot:auth", pull);
    return () => {
      window.removeEventListener("copilot:notes", onChange);
      window.removeEventListener("copilot:auth", pull);
    };
  }, []);

  const add = useCallback(
    (input: { type: SavedType; title: string; content: string; tags?: string[] }) =>
      addSaved(input),
    []
  );

  const remove = useCallback((id: string) => {
    writeLocal(readNotes().filter((n) => n.id !== id));
    void cloudDelete(id);
  }, []);

  return { notes, ready, add, remove };
}
