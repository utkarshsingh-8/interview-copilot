import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";
import { requireOwner } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireOwner(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "AI isn't configured. Add GROQ_API_KEY." },
      { status: 400 }
    );
  }

  let body: { jd?: string; company?: string; resume?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const jd = (body.jd || "").trim();
  const company = (body.company || "").trim();
  if (jd.length < 60) {
    return NextResponse.json(
      { error: "Paste a fuller job description to analyze." },
      { status: 400 }
    );
  }

  const system = `You are a senior AI-engineering hiring manager and career coach. Compare a candidate's resume to a specific job description and produce a targeted prep plan. Be honest about gaps. Return STRICT JSON:
{
  "matchScore": <0-100 integer>,
  "focus": ["top areas this role/JD emphasizes"],
  "matched": ["candidate strengths that map to the JD"],
  "missing": ["skills/keywords in the JD the resume is weak on or missing"],
  "advice": "<2-4 sentences: how to position, what to emphasize, what to shore up>",
  "questions": [{"question":"...","answer":"...","difficulty":"beginner|intermediate|advanced|staff","tags":["..."]}]
}
Generate 5 questions this specific interviewer is likely to ask, mixing role-specific and resume-specific. Answers are strong model answers (4-8 sentences), first person. No markdown.

CANDIDATE RESUME:
${resumeContext(body.resume as never)}`;

  const user = `${company ? `COMPANY: ${company}\n\n` : ""}JOB DESCRIPTION:\n${jd.slice(0, 8000)}`;

  try {
    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.4 }
    );
    const p = JSON.parse(raw);
    const questions = (Array.isArray(p.questions) ? p.questions : [])
      .slice(0, 6)
      .map((q: Record<string, unknown>, i: number) => ({
        id: `jd-${Date.now()}-${i}`,
        category: "genai",
        difficulty: ["beginner", "intermediate", "advanced", "staff"].includes(
          String(q.difficulty)
        )
          ? q.difficulty
          : "intermediate",
        question: String(q.question ?? "").trim(),
        answer: String(q.answer ?? "").trim(),
        tags: Array.isArray(q.tags) ? q.tags.map(String).slice(0, 5) : [],
      }));

    return NextResponse.json({
      matchScore: Math.max(0, Math.min(100, Math.round(Number(p.matchScore) || 0))),
      focus: Array.isArray(p.focus) ? p.focus.map(String).slice(0, 8) : [],
      matched: Array.isArray(p.matched) ? p.matched.map(String).slice(0, 8) : [],
      missing: Array.isArray(p.missing) ? p.missing.map(String).slice(0, 8) : [],
      advice: String(p.advice || "").trim(),
      questions,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
