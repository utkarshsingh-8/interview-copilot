// Server-side Groq client (OpenAI-compatible API). No SDK needed — plain fetch.
// Set GROQ_API_KEY in .env.local. Model is overridable via GROQ_MODEL.

import { resume } from "./resume";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export function hasGroqKey() {
  return !!process.env.GROQ_API_KEY;
}

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function groqChat(
  messages: ChatMsg[],
  opts: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.5,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Compact resume context injected into every AI call so answers stay grounded.
export function resumeContext(): string {
  const exp = resume.experience
    .map(
      (e) =>
        `- ${e.role} @ ${e.company} (${e.start}–${e.end}): ${e.bullets.join(" ")}`
    )
    .join("\n");
  const proj = resume.projects
    .map((p) => `- ${p.name} [${p.stack.join(", ")}]: ${p.bullets.join(" ")}`)
    .join("\n");
  return [
    `Candidate: ${resume.name}, ${resume.title}.`,
    `Summary: ${resume.summary}`,
    `Experience:\n${exp}`,
    `Projects:\n${proj}`,
    `Skills: ${[
      ...resume.skills.genai,
      ...resume.skills.mldl,
      ...resume.skills.llms,
      ...resume.skills.vectorSearch,
      ...resume.skills.backend,
      ...resume.skills.mlops,
    ].join(", ")}`,
  ].join("\n\n");
}
