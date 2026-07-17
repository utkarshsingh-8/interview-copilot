import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "AI grading isn't configured. Add GROQ_API_KEY." },
      { status: 400 }
    );
  }

  let body: {
    question?: string;
    modelAnswer?: string;
    userAnswer?: string;
    resume?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = (body.question || "").trim();
  const userAnswer = (body.userAnswer || "").trim();
  if (!question || !userAnswer) {
    return NextResponse.json(
      { error: "Question and your answer are required." },
      { status: 400 }
    );
  }

  const system = `You are a demanding senior AI-engineering interviewer scoring a candidate's spoken/typed answer. Be fair but rigorous, like a real onsite. Judge correctness, depth, structure, and whether they'd convince an interviewer. Return STRICT JSON:
{"score": <0-100 integer>, "verdict": "<one short line>", "strengths": ["..."], "missing": ["..."], "better": "<a tighter, stronger model answer, 3-6 sentences, first person>"}
No markdown. Base "missing" on concrete gaps vs. what a strong answer needs.

CANDIDATE CONTEXT (for grounding, do not penalize for omitting resume specifics unless relevant):
${resumeContext(body.resume as never)}`;

  const user = `QUESTION:\n${question}\n\n${
    body.modelAnswer ? `REFERENCE ANSWER:\n${body.modelAnswer}\n\n` : ""
  }CANDIDATE'S ANSWER:\n${userAnswer}`;

  try {
    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.3 }
    );
    const p = JSON.parse(raw);
    const score = Math.max(0, Math.min(100, Math.round(Number(p.score) || 0)));
    return NextResponse.json({
      score,
      verdict: String(p.verdict || "").trim(),
      strengths: Array.isArray(p.strengths) ? p.strengths.map(String).slice(0, 5) : [],
      missing: Array.isArray(p.missing) ? p.missing.map(String).slice(0, 5) : [],
      better: String(p.better || "").trim(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Grading failed" },
      { status: 500 }
    );
  }
}
