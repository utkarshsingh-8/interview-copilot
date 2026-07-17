"use client";

import { useState } from "react";
import type { Resume } from "@/lib/resume";

const skillGroups: { key: keyof Resume["skills"]; label: string }[] = [
  { key: "genai", label: "GenAI / LLM" },
  { key: "mldl", label: "ML / DL" },
  { key: "llms", label: "LLMs & APIs" },
  { key: "vectorSearch", label: "Vector & Search" },
  { key: "backend", label: "Backend & Data" },
  { key: "mlops", label: "MLOps & Cloud" },
  { key: "languages", label: "Languages" },
];

const csv = (a: string[]) => (a || []).join(", ");
const fromCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);
const fromLines = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function ResumeEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Resume;
  onSave: (r: Resume) => void;
  onCancel: () => void;
}) {
  // deep copy so edits don't mutate the live resume until saved
  const [draft, setDraft] = useState<Resume>(() =>
    JSON.parse(JSON.stringify(initial))
  );

  const set = (patch: Partial<Resume>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Edit resume</h2>
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-[var(--ink-soft)]"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-[var(--ink-soft)] mb-4">
        Update anything here. When you save, every AI question, the mentor, and
        resume review re-ground on this. Then hit{" "}
        <span className="font-semibold">Regenerate bank</span> to refresh the
        question set.
      </p>

      {/* basics */}
      <Field label="Name">
        <Input value={draft.name} onChange={(v) => set({ name: v })} />
      </Field>
      <Field label="Title">
        <Input value={draft.title} onChange={(v) => set({ title: v })} />
      </Field>
      <Field label="Location">
        <Input value={draft.location} onChange={(v) => set({ location: v })} />
      </Field>
      <Field label="Summary">
        <Area
          value={draft.summary}
          onChange={(v) => set({ summary: v })}
          rows={4}
        />
      </Field>

      {/* skills */}
      <Group title="Skills (comma separated)">
        {skillGroups.map((g) => (
          <Field key={g.key} label={g.label}>
            <Input
              value={csv(draft.skills[g.key])}
              onChange={(v) =>
                set({ skills: { ...draft.skills, [g.key]: fromCsv(v) } })
              }
            />
          </Field>
        ))}
      </Group>

      {/* experience */}
      <Group title="Experience">
        {draft.experience.map((e, i) => (
          <div key={i} className="card-flat p-4 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[var(--ink-soft)]">
                #{i + 1}
              </span>
              <button
                onClick={() =>
                  set({
                    experience: draft.experience.filter((_, x) => x !== i),
                  })
                }
                className="text-xs font-semibold text-[var(--rose-ink)]"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={e.role}
                placeholder="Role"
                onChange={(v) => updateArr(draft, set, "experience", i, { role: v })}
              />
              <Input
                value={e.company}
                placeholder="Company"
                onChange={(v) =>
                  updateArr(draft, set, "experience", i, { company: v })
                }
              />
              <Input
                value={e.start}
                placeholder="Start"
                onChange={(v) =>
                  updateArr(draft, set, "experience", i, { start: v })
                }
              />
              <Input
                value={e.end}
                placeholder="End"
                onChange={(v) => updateArr(draft, set, "experience", i, { end: v })}
              />
            </div>
            <div className="mt-2">
              <Area
                value={(e.bullets || []).join("\n")}
                placeholder="One achievement per line"
                rows={3}
                onChange={(v) =>
                  updateArr(draft, set, "experience", i, { bullets: fromLines(v) })
                }
              />
            </div>
          </div>
        ))}
        <AddButton
          label="Add experience"
          onClick={() =>
            set({
              experience: [
                ...draft.experience,
                { company: "", role: "", location: "", start: "", end: "", bullets: [] },
              ],
            })
          }
        />
      </Group>

      {/* projects */}
      <Group title="Projects">
        {draft.projects.map((p, i) => (
          <div key={i} className="card-flat p-4 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[var(--ink-soft)]">
                #{i + 1}
              </span>
              <button
                onClick={() =>
                  set({ projects: draft.projects.filter((_, x) => x !== i) })
                }
                className="text-xs font-semibold text-[var(--rose-ink)]"
              >
                Remove
              </button>
            </div>
            <Input
              value={p.name}
              placeholder="Project name"
              onChange={(v) => updateArr(draft, set, "projects", i, { name: v })}
            />
            <div className="mt-2">
              <Input
                value={csv(p.stack)}
                placeholder="Stack (comma separated)"
                onChange={(v) =>
                  updateArr(draft, set, "projects", i, { stack: fromCsv(v) })
                }
              />
            </div>
            <div className="mt-2">
              <Area
                value={(p.bullets || []).join("\n")}
                placeholder="One detail per line"
                rows={3}
                onChange={(v) =>
                  updateArr(draft, set, "projects", i, { bullets: fromLines(v) })
                }
              />
            </div>
          </div>
        ))}
        <AddButton
          label="Add project"
          onClick={() =>
            set({
              projects: [...draft.projects, { name: "", stack: [], bullets: [] }],
            })
          }
        />
      </Group>

      {/* actions */}
      <div className="sticky bottom-24 mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-[var(--surface)] text-[var(--ink)] font-semibold py-4 shadow-[var(--shadow-sm)] active:scale-[0.98] transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-[2] rounded-2xl bg-[var(--ink)] text-white font-semibold py-4 active:scale-[0.98] transition"
        >
          Save resume
        </button>
      </div>
    </div>
  );
}

// generic array-item updater for experience/projects
function updateArr<K extends "experience" | "projects">(
  draft: Resume,
  set: (patch: Partial<Resume>) => void,
  key: K,
  index: number,
  patch: Partial<Resume[K][number]>
) {
  const next = draft[key].map((item, i) =>
    i === index ? { ...item, ...patch } : item
  );
  set({ [key]: next } as Partial<Resume>);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold text-[var(--ink-soft)] mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-extrabold text-[var(--ink)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] placeholder:text-[var(--ink-faint)]"
    />
  );
}

function Area({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows ?? 3}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm outline-none shadow-[var(--shadow-sm)] resize-none leading-relaxed placeholder:text-[var(--ink-faint)]"
    />
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-[var(--line)] py-3 text-sm font-semibold text-[var(--ink-soft)] active:scale-[0.99] transition"
    >
      + {label}
    </button>
  );
}
