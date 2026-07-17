"use client";

import { useState } from "react";
import { useLinks } from "@/lib/links";
import {
  defaultVars,
  fillTemplate,
  templates,
  varLabels,
  type TemplateVar,
} from "@/lib/templates";

export default function HubView() {
  const { links, update, add, remove, reset } = useLinks();
  const [editLinks, setEditLinks] = useState(false);
  const [vars, setVars] = useState<Record<TemplateVar, string>>(defaultVars);
  const [openTpl, setOpenTpl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      setCopied("err");
    }
  }

  const varKeys = Object.keys(varLabels) as TemplateVar[];

  return (
    <div className="fade-up">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--violet-ink)]">
            Your Hub
          </p>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-[var(--ink)]">
            Links &amp; templates
          </h1>
        </div>
      </div>

      {/* LINKS */}
      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">My presence</h2>
        <button
          onClick={() => setEditLinks((v) => !v)}
          className="text-sm font-semibold text-[var(--violet-ink)]"
        >
          {editLinks ? "Done" : "Edit"}
        </button>
      </div>

      {!editLinks ? (
        <div className="grid grid-cols-2 gap-3">
          {links
            .filter((l) => l.url)
            .map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="card-flat p-4 flex items-center gap-3 active:scale-[0.98] transition"
              >
                <span className="text-2xl">{l.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--ink)] truncate">
                    {l.label}
                  </p>
                  <p className="text-[11px] text-[var(--ink-faint)] truncate">
                    {l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/^mailto:/, "")}
                  </p>
                </div>
              </a>
            ))}
          {links.filter((l) => l.url).length === 0 && (
            <div className="col-span-2 card-flat p-5 text-center text-sm text-[var(--ink-soft)]">
              Tap Edit to add your GitHub, LeetCode, portfolio, and more.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((l) => (
            <div key={l.id} className="card-flat p-3 flex items-center gap-2">
              <input
                value={l.icon}
                onChange={(e) => update(l.id, { icon: e.target.value })}
                className="w-10 text-center text-xl bg-[var(--surface-muted)] rounded-lg py-2 outline-none"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <input
                  value={l.label}
                  onChange={(e) => update(l.id, { label: e.target.value })}
                  placeholder="Label"
                  className="bg-[var(--surface-muted)] rounded-lg px-2 py-1.5 text-sm outline-none"
                />
                <input
                  value={l.url}
                  onChange={(e) => update(l.id, { url: e.target.value })}
                  placeholder="https://…"
                  className="bg-[var(--surface-muted)] rounded-lg px-2 py-1.5 text-xs outline-none"
                />
              </div>
              <button
                onClick={() => remove(l.id)}
                className="text-[var(--rose-ink)] text-lg px-1"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={add}
              className="flex-1 rounded-xl border-2 border-dashed border-[var(--line)] py-3 text-sm font-semibold text-[var(--ink-soft)]"
            >
              + Add link
            </button>
            <button
              onClick={reset}
              className="rounded-xl bg-[var(--surface-muted)] px-4 text-sm font-semibold text-[var(--ink-soft)]"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      <h2 className="text-lg font-extrabold text-[var(--ink)] mt-8 mb-2">
        Outreach templates
      </h2>
      <p className="text-xs text-[var(--ink-soft)] mb-3">
        Fill these once — every template uses them. Then tap a template to copy.
      </p>

      {/* shared vars */}
      <div className="card-flat p-4 mb-4 grid grid-cols-1 gap-2">
        {varKeys.map((k) => (
          <label key={k} className="block">
            <span className="text-[11px] font-semibold text-[var(--ink-soft)]">
              {varLabels[k]}
            </span>
            {k === "highlight" ? (
              <textarea
                value={vars[k]}
                rows={2}
                onChange={(e) => setVars({ ...vars, [k]: e.target.value })}
                className="mt-1 w-full bg-[var(--surface-muted)] rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />
            ) : (
              <input
                value={vars[k]}
                onChange={(e) => setVars({ ...vars, [k]: e.target.value })}
                className="mt-1 w-full bg-[var(--surface-muted)] rounded-lg px-3 py-2 text-sm outline-none"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {templates.map((t) => {
          const open = openTpl === t.id;
          const filled = fillTemplate(t.body, vars);
          return (
            <div key={t.id} className="card-flat overflow-hidden">
              <button
                onClick={() => setOpenTpl(open ? null : t.id)}
                className="w-full text-left px-4 py-4 flex items-center gap-3"
              >
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-[var(--ink)]">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-[var(--ink-faint)]">
                    {t.channel}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="#9a95ac"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className={`accordion ${open ? "open" : ""}`}>
                <div>
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                      <p className="text-[13px] leading-relaxed text-[var(--ink)] whitespace-pre-line">
                        {filled}
                      </p>
                    </div>
                    <button
                      onClick={() => copy(t.id, filled)}
                      className="mt-3 w-full rounded-xl bg-[var(--ink)] text-white text-sm font-semibold py-3 active:scale-[0.98] transition"
                    >
                      {copied === t.id ? "✓ Copied!" : "Copy to clipboard"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
