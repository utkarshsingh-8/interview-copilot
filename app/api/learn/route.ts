import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";
import { requireOwner } from "@/lib/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await requireOwner(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  if (!hasGroqKey()) {
    return NextResponse.json(
      {
        error:
          "AI mentor isn't configured yet. Add GROQ_API_KEY to .env.local to enable explanations.",
      },
      { status: 400 }
    );
  }

  let body: { question?: string; resume?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Empty question" }, { status: 400 });
  }

  const system = `You are a senior AI engineer mentoring a candidate for AI Engineering interviews. Explain the concept they ask about so they could confidently answer it in an interview.

Structure your answer as:
1. A one-line plain-English definition.
2. A short real-world analogy.
3. The technical detail an interviewer expects.
4. A tiny code snippet or example if useful.
5. "Interviewer follow-ups:" 2-3 questions they might ask next.

Be concise and concrete. When relevant, connect it to the candidate's actual experience below.

CANDIDATE CONTEXT:
${resumeContext(body.resume as never)}`;

  try {
    const answer = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: question },
      ],
      { temperature: 0.4 }
    );
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
