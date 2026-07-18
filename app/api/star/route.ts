import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";
import { requireOwner } from "@/lib/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await requireOwner(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!hasGroqKey()) {
    return NextResponse.json({ error: "AI isn't configured." }, { status: 400 });
  }

  let body: {
    title?: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    resume?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const story = `TITLE: ${body.title || ""}
SITUATION: ${body.situation || ""}
TASK: ${body.task || ""}
ACTION: ${body.action || ""}
RESULT: ${body.result || ""}`;

  const system = `You are an interview coach reviewing a behavioral (STAR) story. Score it and improve it. Reward specificity, ownership ("I" not "we"), and quantified results; penalize vagueness and generic phrasing. Return STRICT JSON:
{"score": <0-100>, "strengths": ["..."], "improvements": ["..."], "rewrite": "<a crisp 4-7 sentence STAR answer in first person, using the candidate's real context, that they could say out loud>"}
No markdown.

CANDIDATE CONTEXT:
${resumeContext(body.resume as never)}`;

  try {
    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: story },
      ],
      { json: true, temperature: 0.4 }
    );
    const p = JSON.parse(raw);
    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(Number(p.score) || 0))),
      strengths: Array.isArray(p.strengths) ? p.strengths.map(String).slice(0, 5) : [],
      improvements: Array.isArray(p.improvements)
        ? p.improvements.map(String).slice(0, 6)
        : [],
      rewrite: String(p.rewrite || "").trim(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
