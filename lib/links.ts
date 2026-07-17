"use client";

// Your professional presence — links you jump to often. localStorage-backed,
// seeded from the resume + common defaults. Fully editable.

import { useCallback, useEffect, useState } from "react";
import { resume } from "./resume";

export type LinkItem = { id: string; label: string; url: string; icon: string };

const KEY = "copilot.links.v1";

function defaults(): LinkItem[] {
  const gh = resume.links.find((l) => /github/i.test(l.label))?.url || "";
  const li = resume.links.find((l) => /linkedin/i.test(l.label))?.url || "";
  return [
    { id: "github", label: "GitHub", url: gh, icon: "🐙" },
    { id: "linkedin", label: "LinkedIn", url: li, icon: "💼" },
    { id: "leetcode", label: "LeetCode", url: "", icon: "🧩" },
    { id: "portfolio", label: "Portfolio", url: "", icon: "🌐" },
    { id: "blog", label: "Blog", url: "", icon: "✍️" },
    { id: "twitter", label: "X / Twitter", url: "", icon: "🐦" },
    { id: "email", label: "Email", url: `mailto:${resume.email}`, icon: "✉️" },
  ];
}

export function useLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setLinks(raw ? (JSON.parse(raw) as LinkItem[]) : defaults());
    } catch {
      setLinks(defaults());
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: LinkItem[]) => {
    setLinks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<LinkItem>) =>
      persist(links.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    [links, persist]
  );

  const add = useCallback(
    () =>
      persist([
        ...links,
        { id: `custom-${links.length}-${Math.round(performance.now())}`, label: "New link", url: "", icon: "🔗" },
      ]),
    [links, persist]
  );

  const remove = useCallback(
    (id: string) => persist(links.filter((l) => l.id !== id)),
    [links, persist]
  );

  const reset = useCallback(() => persist(defaults()), [persist]);

  return { links, ready, update, add, remove, reset };
}
