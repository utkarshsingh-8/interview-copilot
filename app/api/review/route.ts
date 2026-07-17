import { NextResponse } from "next/server";
import { groqChat, hasGroqKey, resumeContext } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      {
        error:
          "AI reviewer isn't configured yet. Add GROQ_API_KEY to .env.local to enable resume review.",
      },
      { status: 400 }
    );
  }

  let body: { resume?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine — falls back to default resume
  }

  const system = `You are a senior technical recruiter and hiring manager at a top product company reviewing an AI Engineer's resume. Be direct and specific. Point out weak bullet points, missing impact/metrics, weak wording, missing keywords, and ATS issues. For each weakness, give a concrete improved version.

Return your review in this exact structure:
OVERALL: one honest paragraph.
STRENGTHS: 3 bullet points.
FIX THESE: 4-6 items, each as "• [what's weak] → [rewritten stronger version]".
MISSING: 2-3 things that would strengthen the resume.

Keep it tight and actionable. No preamble.`;

  const user = `Review this resume:\n\n${resumeContext(body.resume as never)}`;

  try {
    const review = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.4 }
    );
    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
