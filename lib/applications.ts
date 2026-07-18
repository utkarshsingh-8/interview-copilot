"use client";

// Job application tracker. localStorage source of truth, mirrored to Supabase
// `applications` when signed in.

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type Stage =
  | "wishlist"
  | "applied"
  | "oa"
  | "phone"
  | "onsite"
  | "offer"
  | "rejected";

export const stageMeta: Record<
  Stage,
  { label: string; color: string; order: number }
> = {
  wishlist: { label: "Wishlist", color: "bg-[#eee9f7] text-[#6b6580]", order: 0 },
  applied: { label: "Applied", color: "bg-[#e7eefb] text-[#3a6bd0]", order: 1 },
  oa: { label: "OA / Test", color: "bg-[#e8f0fb] text-[#3f7bc0]", order: 2 },
  phone: { label: "Phone", color: "bg-[#f3e9fb] text-[#8a4fc0]", order: 3 },
  onsite: { label: "Onsite", color: "bg-[#fdf1e3] text-[#c08a3a]", order: 4 },
  offer: { label: "Offer", color: "bg-[#e2f3ea] text-[#2f8a5b]", order: 5 },
  rejected: { label: "Rejected", color: "bg-[#fbe6ec] text-[#b1607a]", order: 6 },
};

export type Application = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  url: string;
  nextAction: string;
  notes: string;
  jd: string;
  updatedAt: string;
};

const KEY = "copilot.apps.v1";

function read(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}
function writeLocal(items: Application[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("copilot:apps"));
}
function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `a-${Date.now()}-${Math.round(performance.now())}`;
  }
}

async function cloudUpsert(a: Application) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await sb.from("applications").upsert({
      id: a.id,
      user_id: uid,
      company: a.company,
      role: a.role,
      stage: a.stage,
      url: a.url,
      next_action: a.nextAction,
      notes: a.notes,
      jd: a.jd,
      updated_at: a.updatedAt,
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
    await sb.from("applications").delete().eq("id", id);
  } catch {
    /* best-effort */
  }
}

async function reconcileCloud(): Promise<Application[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return null;
    const { data } = await sb
      .from("applications")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (data && data.length) {
      const items: Application[] = data.map((r) => ({
        id: String(r.id),
        company: r.company,
        role: r.role,
        stage: r.stage,
        url: r.url ?? "",
        nextAction: r.next_action ?? "",
        notes: r.notes ?? "",
        jd: r.jd ?? "",
        updatedAt: r.updated_at,
      }));
      localStorage.setItem(KEY, JSON.stringify(items));
      return items;
    }
    for (const a of read()) await cloudUpsert(a);
    return null;
  } catch {
    return null;
  }
}

export function useApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setApps(read());
    setReady(true);
    const pull = () =>
      reconcileCloud().then((items) => {
        if (items) setApps(items);
      });
    pull();
    const onChange = () => setApps(read());
    window.addEventListener("copilot:apps", onChange);
    window.addEventListener("copilot:auth", pull);
    return () => {
      window.removeEventListener("copilot:apps", onChange);
      window.removeEventListener("copilot:auth", pull);
    };
  }, []);

  const save = useCallback((a: Application) => {
    const items = read();
    const idx = items.findIndex((x) => x.id === a.id);
    const next = { ...a, updatedAt: new Date().toISOString() };
    if (idx >= 0) items[idx] = next;
    else items.unshift(next);
    writeLocal(items);
    void cloudUpsert(next);
  }, []);

  const remove = useCallback((id: string) => {
    writeLocal(read().filter((a) => a.id !== id));
    void cloudDelete(id);
  }, []);

  const create = useCallback((): Application => {
    return {
      id: newId(),
      company: "",
      role: "",
      stage: "wishlist",
      url: "",
      nextAction: "",
      notes: "",
      jd: "",
      updatedAt: new Date().toISOString(),
    };
  }, []);

  return { apps, ready, save, remove, create };
}
