// Reusable outreach templates. Placeholders like {{company}} are filled from a
// shared set of variables in the Hub UI, then copied to the clipboard.

import { resume } from "./resume";

export type TemplateVar =
  | "yourName"
  | "role"
  | "company"
  | "recruiterName"
  | "highlight";

export const varLabels: Record<TemplateVar, string> = {
  yourName: "Your name",
  role: "Target role",
  company: "Company",
  recruiterName: "Recruiter / contact name",
  highlight: "Your one-line highlight",
};

export const defaultVars: Record<TemplateVar, string> = {
  yourName: resume.name,
  role: "AI Engineer",
  company: "",
  recruiterName: "",
  highlight:
    "production GenAI — multi-portal RAG, LoRA fine-tuning of BioMistral-7B, and GPU-served inference at ~2.5s p95",
};

export type Template = {
  id: string;
  title: string;
  emoji: string;
  channel: string;
  body: string;
};

export const templates: Template[] = [
  {
    id: "li-recruiter",
    title: "LinkedIn recruiter reach-out",
    emoji: "💼",
    channel: "LinkedIn DM",
    body: `Hi {{recruiterName}}, I came across the {{role}} opening at {{company}} and it lines up closely with what I do. I'm {{yourName}}, an AI Engineer working on {{highlight}}. I'd love to be considered — happy to share more on how I'd add value to your team. Would it help if I sent my resume or a quick portfolio link?`,
  },
  {
    id: "cold-hm",
    title: "Cold email to hiring manager",
    emoji: "📧",
    channel: "Email",
    body: `Subject: {{role}} — {{yourName}} (AI Engineer)

Hi {{recruiterName}},

I'm reaching out about the {{role}} role at {{company}}. I'm an AI Engineer focused on {{highlight}}.

A couple of things I've shipped that map to this role:
• Designed and shipped an end-to-end RAG + fine-tuning pipeline serving real users in production.
• Backend depth (FastAPI/Flask, Redis, PostgreSQL) so the AI runs as a reliable, low-latency service.

I'd welcome the chance to talk. My resume and GitHub are linked below.

Best,
{{yourName}}`,
  },
  {
    id: "referral",
    title: "Referral request (to a connection)",
    emoji: "🤝",
    channel: "LinkedIn / Email",
    body: `Hi {{recruiterName}}, hope you're doing well! I saw {{company}} is hiring for a {{role}} and I'm really keen. I'm an AI Engineer working on {{highlight}}. Would you be open to referring me, or pointing me to the right person? Happy to send my resume so it's an easy forward. Thanks so much either way!`,
  },
  {
    id: "connect-note",
    title: "LinkedIn connection request note",
    emoji: "➕",
    channel: "LinkedIn",
    body: `Hi {{recruiterName}}, I'm {{yourName}}, an AI Engineer working on {{highlight}}. I follow {{company}}'s work and would love to connect and learn from your team. Thanks for considering!`,
  },
  {
    id: "thank-you",
    title: "Post-interview thank-you",
    emoji: "🙏",
    channel: "Email",
    body: `Subject: Thank you — {{role}} interview

Hi {{recruiterName}},

Thank you for the conversation about the {{role}} role at {{company}} — I really enjoyed it, especially digging into the technical side. It reinforced how well my background in {{highlight}} fits what your team is building.

Please let me know if there's anything else I can share. Looking forward to next steps.

Best,
{{yourName}}`,
  },
  {
    id: "followup",
    title: "Follow-up after no response",
    emoji: "🔁",
    channel: "Email",
    body: `Subject: Following up — {{role}} at {{company}}

Hi {{recruiterName}},

Just following up on my application for the {{role}} role. I remain very interested and think my experience in {{highlight}} is a strong match.

Happy to share anything that would help. Thanks for your time!

Best,
{{yourName}}`,
  },
  {
    id: "open-to-work",
    title: '"Open to work" LinkedIn post',
    emoji: "📣",
    channel: "LinkedIn post",
    body: `I'm exploring new {{role}} opportunities. 🚀

I'm an AI Engineer working on {{highlight}}. I love taking AI from prototype to a reliable, low-latency product — retrieval, fine-tuning, evaluation, and serving.

If your team is hiring (or you know someone who is), I'd love to connect. Resume and projects in the comments. Reposts hugely appreciated! 🙏`,
  },
];

export function fillTemplate(
  body: string,
  vars: Record<TemplateVar, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    const v = vars[key as TemplateVar];
    return v && v.trim() ? v : `{{${key}}}`;
  });
}
