import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { groqChat, hasGroqKey } from "@/lib/ai";
import { resume as defaultResume, type Resume } from "@/lib/resume";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasGroqKey()) {
    return NextResponse.json(
      { error: "AI isn't configured. Add GROQ_API_KEY to parse resumes." },
      { status: 400 }
    );
  }

  let text = "";
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No PDF file" }, { status: 400 });
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else {
      const body = await req.json();
      text = String(body.text || "");
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Couldn't read the file: ${e instanceof Error ? e.message : ""}` },
      { status: 400 }
    );
  }

  text = text.trim();
  if (text.length < 40) {
    return NextResponse.json(
      { error: "Not enough text found. Try a text-based PDF or paste the text." },
      { status: 400 }
    );
  }

  const system = `You are a precise resume parser. Convert the raw resume text into STRICT JSON matching this exact TypeScript shape. Extract only what's present; use "" or [] when unknown. Do NOT invent facts.

{
  "name": string,
  "title": string,
  "location": string,
  "phone": string,
  "email": string,
  "links": [{ "label": string, "url": string }],
  "summary": string,
  "skills": {
    "genai": string[], "mldl": string[], "llms": string[],
    "vectorSearch": string[], "backend": string[], "mlops": string[], "languages": string[]
  },
  "experience": [{ "company": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[] }],
  "projects": [{ "name": string, "stack": string[], "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "location": string, "start": string, "end": string }]
}

Group skills sensibly into the buckets. Keep bullet points as concise standalone strings. Return ONLY the JSON object.`;

  try {
    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: `RESUME TEXT:\n\n${text.slice(0, 12000)}` },
      ],
      { json: true, temperature: 0.1 }
    );
    const p = JSON.parse(raw);

    // defensive merge into a full Resume
    const parsed: Resume = {
      name: str(p.name) || defaultResume.name,
      title: str(p.title) || defaultResume.title,
      location: str(p.location),
      phone: str(p.phone),
      email: str(p.email),
      links: Array.isArray(p.links)
        ? p.links
            .map((l: Record<string, unknown>) => ({
              label: str(l?.label),
              url: str(l?.url),
            }))
            .filter((l: { url: string }) => l.url)
        : [],
      summary: str(p.summary),
      skills: {
        genai: arr(p.skills?.genai),
        mldl: arr(p.skills?.mldl),
        llms: arr(p.skills?.llms),
        vectorSearch: arr(p.skills?.vectorSearch),
        backend: arr(p.skills?.backend),
        mlops: arr(p.skills?.mlops),
        languages: arr(p.skills?.languages),
      },
      experience: Array.isArray(p.experience)
        ? p.experience.map((e: Record<string, unknown>) => ({
            company: str(e?.company),
            role: str(e?.role),
            location: str(e?.location),
            start: str(e?.start),
            end: str(e?.end),
            bullets: arr(e?.bullets),
          }))
        : [],
      projects: Array.isArray(p.projects)
        ? p.projects.map((pr: Record<string, unknown>) => ({
            name: str(pr?.name),
            stack: arr(pr?.stack),
            bullets: arr(pr?.bullets),
          }))
        : [],
      education: Array.isArray(p.education)
        ? p.education.map((ed: Record<string, unknown>) => ({
            school: str(ed?.school),
            degree: str(ed?.degree),
            location: str(ed?.location),
            start: str(ed?.start),
            end: str(ed?.end),
          }))
        : [],
    };

    return NextResponse.json({ resume: parsed });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Parse failed" },
      { status: 500 }
    );
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}
