import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";
import { categoryMeta, type Category } from "@/lib/questions";

export const runtime = "nodejs";

const validCategories = Object.keys(categoryMeta) as Category[];

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Add GROQ_API_KEY to .env.local to generate questions.",
      },
      { status: 400 }
    );
  }

  let body: { category?: string; count?: number; resume?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = (
    validCategories.includes(body.category as Category)
      ? body.category
      : "genai"
  ) as Category;
  const count = Math.min(Math.max(body.count ?? 4, 1), 8);
  const meta = categoryMeta[category];

  const system = `You are a senior AI-engineering interviewer preparing a specific candidate for interviews at top product companies. Ask sharp, resume-specific questions and write strong model answers in the candidate's first-person voice, grounded ONLY in the candidate's real experience below. Be concrete and technical. Never invent facts not implied by the resume.

CANDIDATE CONTEXT:
${resumeContext(body.resume as never)}`;

  const user = `Generate ${count} interview questions in the "${meta.label}" area (${meta.blurb}). Vary difficulty across beginner, intermediate, advanced, and staff. Return STRICT JSON of the form:
{"questions":[{"question":"...","answer":"...","difficulty":"beginner|intermediate|advanced|staff","tags":["...","..."]}]}
The "answer" must be a strong, specific model answer (4-8 sentences) in the candidate's first person. Do not include markdown.`;

  try {
    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.6 }
    );
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions = arr.slice(0, count).map((q: Record<string, unknown>, i: number) => ({
      id: `ai-${category}-${Date.now()}-${i}`,
      category,
      difficulty: ["beginner", "intermediate", "advanced", "staff"].includes(
        String(q.difficulty)
      )
        ? q.difficulty
        : "intermediate",
      question: String(q.question ?? "").trim(),
      answer: String(q.answer ?? "").trim(),
      tags: Array.isArray(q.tags)
        ? q.tags.map((t: unknown) => String(t)).slice(0, 5)
        : [],
    }));

    return NextResponse.json({ questions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
